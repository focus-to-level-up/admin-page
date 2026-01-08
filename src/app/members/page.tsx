'use client';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/lib/api';
import { format, subDays, addDays } from 'date-fns';
import { ko } from 'date-fns/locale'; 
import { 
  Search, User, ChevronDown, ChevronLeft, ChevronRight, // 아이콘 추가
  ShieldAlert, ShieldCheck, BarChart2, Ban
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { MemberSearchResult, MemberDetail } from '@/types';

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
};

export default function MembersPage() {
  const [searchType, setSearchType] = useState<'NICKNAME' | 'ID'>('NICKNAME'); // 검색 타입
  const [keyword, setKeyword] = useState('');
  const [searchParams, setSearchParams] = useState({ type: 'NICKNAME', keyword: '' });

  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSchoolAddress, setEditSchoolAddress] = useState('');
  const [statsBaseDate, setStatsBaseDate] = useState<Date>(new Date());

  const queryClient = useQueryClient();

  const { data: memberStats, isLoading: statsLoading } = useQuery({
    queryKey: ['memberStats', selectedMember?.memberId, format(statsBaseDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!selectedMember?.memberId) return null;
      const endDate = format(statsBaseDate, 'yyyy-MM-dd');
      const startDate = format(subDays(statsBaseDate, 6), 'yyyy-MM-dd'); // 6일 전부터 오늘까지 (총 7일)
      
      const res = await memberApi.getStats(selectedMember.memberId, startDate, endDate);
      return res.data.data;
    },
    enabled: !!selectedMember?.memberId,
  });

  const handlePrevWeek = () => setStatsBaseDate(prev => subDays(prev, 7));
  const handleNextWeek = () => {
    const nextDate = addDays(statsBaseDate, 7);
    // 미래 날짜로 가는 것은 오늘까지만 허용하고 싶다면 조건 추가 가능
    if (nextDate > new Date()) {
        setStatsBaseDate(new Date()); 
    } else {
        setStatsBaseDate(nextDate);
    }
  };

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['memberSearch', searchParams.type, searchParams.keyword],
    queryFn: async () => {
      if (!searchParams.keyword) return { content: [] };
      const res = await memberApi.search(searchParams.type, searchParams.keyword);
      return { content: res.data.data };
    },
    enabled: !!searchParams.keyword,
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

  const banMutation = useMutation({
    mutationFn: (memberId: number) => memberApi.banMember(memberId),
    onSuccess: () => {
      alert('해당 유저의 랭킹이 정지되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['memberDetail'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (memberId: number) => memberApi.restoreMember(memberId),
    onSuccess: () => {
      alert('해당 유저의 상태가 정상(ACTIVE)으로 복구되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['memberDetail'] });
    },
  });

  const handleSearch = (e?: React.FormEvent, overrideType?: string, overrideKeyword?: string) => {
    if (e) e.preventDefault();
    
    setSearchParams({ 
        type: overrideType || searchType, 
        keyword: overrideKeyword || keyword 
    });
  };

  const searchBannedUsers = () => {
    // 입력창 초기화 (선택 사항)
    setKeyword('RANKING_BANNED'); 
    setSearchType('NICKNAME'); // UI상으로는 닉네임 등으로 돌려둠 (검색 로직에는 영향 X)
    
    // 실제 검색 요청
    handleSearch(undefined, 'STATUS', 'RANKING_BANNED');
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

  const chartData = (memberStats?.dailyStats || []).map((stat: any) => ({
    // "2026-01-08" -> "01.08 (목)" 형식으로 변환
    name: format(new Date(stat.date), 'MM.dd (EEE)', { locale: ko }), 
    
    totalHours: Number((stat.totalFocusSeconds / 3600).toFixed(1)),
    maxConsecutiveMinutes: Number((stat.maxConsecutiveSeconds / 60).toFixed(0)),
    originalTotal: stat.totalFocusSeconds,
    originalMax: stat.maxConsecutiveSeconds,
  }));

  // [추가] NaN 방지 렌더링 헬퍼
  const displayTime = (seconds: number | undefined) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return '0분';
    return formatTime(seconds);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-500 mt-1">회원을 검색하고 정보를 수정할 수 있습니다.</p>
        </div>

        {/* 검색 폼 */}
        <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-2xl">
              <div className="relative">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'NICKNAME' | 'ID')}
                  className="appearance-none bg-white border border-gray-300 text-gray-900 py-2 pl-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="NICKNAME">닉네임</option>
                  <option value="ID">회원 ID</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={searchType === 'NICKNAME' ? "닉네임으로 검색" : "회원 ID로 검색"}
                  className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
            </form>

            {/* [추가] 랭킹 밴 유저 조회 버튼 */}
            <button
                onClick={searchBannedUsers}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors border border-red-200"
            >
                <Ban size={18} />
                <span>랭킹 밴 유저 조회</span>
            </button>
        </div>

          {/* 검색 결과 목록 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow h-fit">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">
                {searchParams.type === 'STATUS' && searchParams.keyword === 'RANKING_BANNED' 
                    ? '🚫 랭킹 정지된 유저 목록' 
                    : `검색 결과 (${searchResults?.content?.length || 0})`}
              </h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400">검색 중...</div>
              ) : !searchResults?.content?.length ? (
                <div className="p-8 text-center text-gray-400">
                  {searchParams.keyword ? '검색 결과가 없습니다.' : '회원을 검색해주세요.'}
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        member.status === 'RANKING_BANNED' ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-500'
                      }`}>
                        <User size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{member.nickname}</p>
                          {member.status === 'RANKING_BANNED' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">BANNED</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          ID: {member.memberId} | {member.socialType}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 회원 상세 정보 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">회원 상세 정보</h2>
                {/* [추가] 상태 관리 버튼 */}
                {memberDetail && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if(confirm('정말 이 유저를 랭킹 정지(Ban) 시키겠습니까?')) {
                          banMutation.mutate(memberDetail.memberId);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                    >
                      <ShieldAlert size={16} /> 랭킹 정지
                    </button>
                    <button
                      onClick={() => {
                        if(confirm('정말 이 유저의 상태를 정상(Active)으로 복구하시겠습니까?')) {
                          restoreMutation.mutate(memberDetail.memberId);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
                    >
                      <ShieldCheck size={16} /> 복구
                    </button>
                  </div>
                )}
              </div>
              
              {/* ... (기존 상세 정보 UI 유지) ... */}
              
              {detailLoading ? (
                <div className="p-8 text-center text-gray-400">로딩 중...</div>
              ) : !memberDetail ? (
                <div className="p-8 text-center text-gray-400">왼쪽에서 회원을 선택해주세요.</div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* ... (기존 정보들) ... */}
                  {/* 회원 ID (RevenueCat용) */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">RevenueCat 회원 ID</p>
                    <p className="text-lg font-mono mt-1">{memberDetail.memberId}</p>
                  </div>
                  {/* ... (닉네임, 상태메시지, 학교 등 기존 필드들) ... */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">가입일</p>
                      <p className="font-medium text-gray-900">{memberDetail.createdAt}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">현재 상태</p>
                      <p className={`font-medium ${
                        memberDetail.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {memberDetail.status}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* [추가] 통계 정보 섹션 */}
            {selectedMember && (
              <div className="bg-white rounded-xl shadow">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={20} className="text-gray-500" />
                    <h2 className="font-semibold text-gray-900">활동 분석</h2>
                  </div>
                  
                  {/* [추가] 날짜 네비게이션 */}
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                    <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-200 rounded text-gray-600">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 px-2 min-w-[140px] text-center">
                        {format(subDays(statsBaseDate, 6), 'MM.dd')} ~ {format(statsBaseDate, 'MM.dd')}
                    </span>
                    <button 
                        onClick={handleNextWeek} 
                        disabled={format(statsBaseDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
                        className={`p-1 rounded text-gray-600 ${
                            format(statsBaseDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                            ? 'opacity-30 cursor-not-allowed' 
                            : 'hover:bg-gray-200'
                        }`}
                    >
                        <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-8">
                  {statsLoading ? (
                    <div className="text-center text-gray-400 py-10">데이터 분석 중...</div>
                  ) : !memberStats ? (
                    <div className="text-center text-gray-400 py-4">통계 데이터가 없습니다.</div>
                  ) : (
                    <>
                      {/* 요약 카드 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-sm text-blue-600 font-medium mb-1">누적 일일 평균 집중</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {displayTime(memberStats.totalAverageFocusSeconds)}
                          </p>
                        </div>
                        <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
                          <p className="text-sm text-purple-600 font-medium mb-1">누적 평균 최대 연속</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {displayTime(memberStats.totalAverageMaxConsecutiveSeconds)}
                          </p>
                        </div>
                      </div>

                      {/* 일별 추이 차트 */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">주간 학습 추이 (일별)</h3>
                        <div className="h-[300px] w-full">
                          {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid stroke="#f5f5f5" />
                                <XAxis dataKey="name" scale="point" padding={{ left: 20, right: 20 }} fontSize={12} />
                                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" width={40} fontSize={12} />
                                <YAxis yAxisId="right" orientation="right" stroke="#8B5CF6" width={40} fontSize={12} />
                                <Tooltip 
                                  content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                                          <p className="font-bold mb-2">{label}</p>
                                          <p className="text-blue-600">
                                            총 공부: {formatTime(data.originalTotal)}
                                          </p>
                                          <p className="text-purple-600">
                                            최대 연속: {formatTime(data.originalMax)}
                                          </p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="totalHours" name="총 공부 시간 (시간)" barSize={30} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="maxConsecutiveMinutes" name="최대 연속 집중 (분)" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">
                              차트 데이터가 없습니다.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            </div>
        </div>
      </div>
    </Layout>
  );
}
