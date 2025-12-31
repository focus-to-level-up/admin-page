'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/lib/api';
import { Search, Edit2, X, Check, User } from 'lucide-react';
import type { MemberSearchResult, MemberDetail } from '@/types';

export default function MembersPage() {
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSchoolAddress, setEditSchoolAddress] = useState('');
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['memberSearch', searchKeyword],
    queryFn: async () => {
      if (!searchKeyword) return { content: [] };
      const res = await memberApi.search(searchKeyword);
      // 백엔드가 단일 객체를 반환하므로 배열로 감싸기
      const member = res.data.data;
      return { content: member ? [member] : [] };
    },
    enabled: !!searchKeyword,
  });

  const { data: memberDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['memberDetail', selectedMember?.memberId],
    queryFn: async () => {
      if (!selectedMember?.memberId) return null;
      const res = await memberApi.getDetail(selectedMember.memberId);
      return res.data.data;
    },
    enabled: !!selectedMember?.memberId,
  });

  const updateNicknameMutation = useMutation({
    mutationFn: ({ memberId, nickname }: { memberId: number; nickname: string }) =>
      memberApi.updateNickname(memberId, nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberDetail'] });
      queryClient.invalidateQueries({ queryKey: ['memberSearch'] });
      setEditingField(null);
    },
  });

  const updateProfileMessageMutation = useMutation({
    mutationFn: ({ memberId, profileMessage }: { memberId: number; profileMessage: string }) =>
      memberApi.updateProfileMessage(memberId, profileMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberDetail'] });
      setEditingField(null);
    },
  });

  const updateSchoolMutation = useMutation({
    mutationFn: ({ memberId, school, schoolAddress }: { memberId: number; school: string; schoolAddress?: string }) =>
      memberApi.updateSchool(memberId, school, schoolAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberDetail'] });
      setEditingField(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(keyword);
  };

  const handleEdit = (field: string, value: string, schoolAddress?: string) => {
    setEditingField(field);
    setEditValue(value || '');
    if (field === 'school') {
      setEditSchoolAddress(schoolAddress || '');
    }
  };

  const handleSave = () => {
    if (!memberDetail) return;

    if (editingField === 'nickname') {
      updateNicknameMutation.mutate({ memberId: memberDetail.memberId, nickname: editValue });
    } else if (editingField === 'profileMessage') {
      updateProfileMessageMutation.mutate({ memberId: memberDetail.memberId, profileMessage: editValue });
    } else if (editingField === 'school') {
      updateSchoolMutation.mutate({ memberId: memberDetail.memberId, school: editValue, schoolAddress: editSchoolAddress });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-500 mt-1">회원을 검색하고 정보를 수정할 수 있습니다.</p>
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="닉네임 또는 회원 ID로 검색"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 검색 결과 목록 */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">검색 결과</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400">검색 중...</div>
              ) : !searchResults?.content?.length ? (
                <div className="p-8 text-center text-gray-400">
                  {searchKeyword ? '검색 결과가 없습니다.' : '회원을 검색해주세요.'}
                </div>
              ) : (
                searchResults.content.map((member: MemberSearchResult) => (
                  <button
                    key={member.memberId}
                    onClick={() => setSelectedMember(member as unknown as MemberDetail)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedMember?.memberId === member.memberId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={20} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.nickname}</p>
                        <p className="text-sm text-gray-500">
                          ID: {member.memberId} | {member.socialType} | {member.status}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 회원 상세 정보 */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">회원 상세 정보</h2>
            </div>
            {detailLoading ? (
              <div className="p-8 text-center text-gray-400">로딩 중...</div>
            ) : !memberDetail ? (
              <div className="p-8 text-center text-gray-400">
                왼쪽에서 회원을 선택해주세요.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* 회원 ID (RevenueCat용) */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">RevenueCat 회원 ID</p>
                  <p className="text-lg font-mono mt-1">{memberDetail.memberId}</p>
                </div>

                {/* 닉네임 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">닉네임</p>
                    {editingField === 'nickname' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="mt-1 px-2 py-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <p className="font-medium">{memberDetail.nickname}</p>
                    )}
                  </div>
                  {editingField === 'nickname' ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingField(null)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit('nickname', memberDetail.nickname)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                {/* 상태메시지 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">상태메시지</p>
                    {editingField === 'profileMessage' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="mt-1 w-full px-2 py-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <p className="font-medium">{memberDetail.profileMessage || '-'}</p>
                    )}
                  </div>
                  {editingField === 'profileMessage' ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingField(null)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit('profileMessage', memberDetail.profileMessage || '')}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                {/* 학교 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">학교</p>
                    {editingField === 'school' ? (
                      <div className="space-y-2 mt-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="학교명"
                          className="w-full px-2 py-1 border rounded"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editSchoolAddress}
                          onChange={(e) => setEditSchoolAddress(e.target.value)}
                          placeholder="학교 주소 (선택)"
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{memberDetail.school || '-'}</p>
                        {memberDetail.schoolAddress && (
                          <p className="text-sm text-gray-400">{memberDetail.schoolAddress}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {editingField === 'school' ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingField(null)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit('school', memberDetail.school || '', memberDetail.schoolAddress || '')}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                {/* 기타 정보 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">골드</p>
                    <p className="font-medium">{memberDetail.gold?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">다이아</p>
                    <p className="font-medium">{memberDetail.diamond?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">레벨</p>
                    <p className="font-medium">{memberDetail.currentLevel ?? 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">카테고리</p>
                    <p className="font-medium">
                      {memberDetail.categoryMain ?? '-'} / {memberDetail.categorySub ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">소셜 로그인</p>
                  <p className="font-medium">{memberDetail.socialType}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">가입일</p>
                    <p className="font-medium">{memberDetail.createdAt}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">마지막 로그인</p>
                    <p className="font-medium">{memberDetail.lastLoginDateTime ?? '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
