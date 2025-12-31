'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { guildApi } from '@/lib/api';
import { Search, Edit2, X, Check, Building2 } from 'lucide-react';
import type { GuildDetail } from '@/types';

export default function GuildsPage() {
  const [guildId, setGuildId] = useState('');
  const [searchedGuildId, setSearchedGuildId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const queryClient = useQueryClient();

  const { data: guildDetail, isLoading, error } = useQuery({
    queryKey: ['guildDetail', searchedGuildId],
    queryFn: async () => {
      if (!searchedGuildId) return null;
      const res = await guildApi.getDetail(searchedGuildId);
      return res.data.data;
    },
    enabled: !!searchedGuildId,
  });

  const updateNameMutation = useMutation({
    mutationFn: ({ guildId, name }: { guildId: number; name: string }) =>
      guildApi.updateName(guildId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guildDetail'] });
      setEditingField(null);
      alert('길드 이름이 변경되었습니다.');
    },
    onError: (error: Error) => {
      alert(`변경 실패: ${error.message}`);
    },
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: ({ guildId, description }: { guildId: number; description: string }) =>
      guildApi.updateDescription(guildId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guildDetail'] });
      setEditingField(null);
      alert('길드 소개가 변경되었습니다.');
    },
    onError: (error: Error) => {
      alert(`변경 실패: ${error.message}`);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(guildId);
    if (isNaN(id) || id <= 0) {
      alert('유효한 길드 ID를 입력해주세요.');
      return;
    }
    setSearchedGuildId(id);
  };

  const handleEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const handleSave = () => {
    if (!guildDetail) return;

    if (editingField === 'name') {
      if (!editValue.trim()) {
        alert('길드 이름을 입력해주세요.');
        return;
      }
      updateNameMutation.mutate({ guildId: guildDetail.guildId, name: editValue });
    } else if (editingField === 'description') {
      updateDescriptionMutation.mutate({ guildId: guildDetail.guildId, description: editValue });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">길드 관리</h1>
          <p className="text-gray-500 mt-1">길드 정보를 조회하고 수정합니다.</p>
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              placeholder="길드 ID를 입력하세요"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            조회
          </button>
        </form>

        {/* 길드 상세 정보 */}
        <div className="bg-white rounded-xl shadow max-w-2xl">
          <div className="p-4 border-b flex items-center gap-3">
            <Building2 className="text-gray-400" size={24} />
            <h2 className="font-semibold text-gray-900">길드 상세 정보</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              길드를 찾을 수 없습니다.
            </div>
          ) : !guildDetail ? (
            <div className="p-8 text-center text-gray-400">
              길드 ID를 입력하여 검색해주세요.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* 길드 ID */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">길드 ID</p>
                <p className="text-lg font-mono mt-1">{guildDetail.guildId}</p>
              </div>

              {/* 길드 이름 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">길드 이름</p>
                  {editingField === 'name' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="mt-1 w-full px-2 py-1 border rounded"
                      autoFocus
                    />
                  ) : (
                    <p className="font-medium text-lg">{guildDetail.name}</p>
                  )}
                </div>
                {editingField === 'name' ? (
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
                    onClick={() => handleEdit('name', guildDetail.name)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>

              {/* 길드 소개 */}
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">길드 소개</p>
                  {editingField === 'description' ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="mt-1 w-full px-2 py-1 border rounded resize-none"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">
                      {guildDetail.description || '-'}
                    </p>
                  )}
                </div>
                {editingField === 'description' ? (
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
                    onClick={() => handleEdit('description', guildDetail.description || '')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>

              {/* 기타 정보 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">카테고리</p>
                  <p className="font-medium">{guildDetail.category}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">공개 여부</p>
                  <p className="font-medium">{guildDetail.isPublic ? '공개' : '비공개'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">인원</p>
                  <p className="font-medium">
                    {guildDetail.currentMembers} / {guildDetail.maxMembers}명
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">목표 집중 시간</p>
                  <p className="font-medium">{guildDetail.targetFocusTime}분</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">생성일</p>
                <p className="font-medium">{guildDetail.createdAt}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
