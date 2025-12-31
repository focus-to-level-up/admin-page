'use client';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leagueApi } from '@/lib/api'; 
import { Search, ChevronRight, ArrowLeft, Ban, ShieldAlert } from 'lucide-react';
import { LeagueInfo, RankingInfo } from '@/types';

export default function LeaguePage() {
  const [selectedLeague, setSelectedLeague] = useState<LeagueInfo | null>(null);
  const [selectedRankingMember, setSelectedRankingMember] = useState<RankingInfo | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // 1. 리그 목록 조회
  const { data: leagueData, isLoading: leaguesLoading } = useQuery({
    queryKey: ['adminLeagues'],
    // [수정 2] leagueApi.getLeagues 로 호출
    queryFn: async () => {
      const res = await leagueApi.getLeagues();
      return res.data.data; 
    },
    enabled: !selectedLeague,
  });

  // 2. 선택된 리그의 랭킹 조회
  const { data: rankingData, isLoading: rankingsLoading } = useQuery({
    queryKey: ['adminRankings', selectedLeague?.leagueId],
    // [수정 3] leagueApi.getRankingsByLeague 로 호출
    queryFn: async () => {
        if (!selectedLeague) return null;
        const res = await leagueApi.getRankingsByLeague(selectedLeague.leagueId);
        return res.data.data;
    },
    enabled: !!selectedLeague,
  });

  // 3. 랭킹 제외 (Ban) 뮤테이션
  const banMutation = useMutation({
    // [수정 4] leagueApi.banMemberFromRanking 로 호출
    mutationFn: (memberId: number) => leagueApi.banMemberFromRanking(memberId),
    onSuccess: () => {
      alert('성공적으로 랭킹에서 제외되었습니다.');
      setIsBanModalOpen(false);
      setSelectedRankingMember(null);
      queryClient.invalidateQueries({ queryKey: ['adminRankings', selectedLeague?.leagueId] });
    },
    onError: (error: any) => {
      alert(`처리 실패: ${error.response?.data?.message || '알 수 없는 오류'}`);
    }
  });

  const handleLeagueClick = (league: LeagueInfo) => {
    setSelectedLeague(league);
  };

  const handleBackToList = () => {
    setSelectedLeague(null);
    setSelectedRankingMember(null);
  };

  const handleBanClick = (ranking: RankingInfo) => {
    setSelectedRankingMember(ranking);
    setIsBanModalOpen(true);
  };

  const confirmBan = () => {
    if (selectedRankingMember) {
      banMutation.mutate(selectedRankingMember.memberId);
    }
  };
  return (
    <Layout>
      <div className="space-y-6">
        {/* 헤더 영역 */}
        <div className="flex items-center gap-4">
          {selectedLeague && (
            <button 
              onClick={handleBackToList}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedLeague ? `${selectedLeague.name} 랭킹 관리` : '리그 관리'}
            </h1>
            <p className="text-gray-500 mt-1">
              {selectedLeague 
                ? `${selectedLeague.tier} 티어 | 현재 ${rankingData?.totalMembers || 0}명 참여 중`
                : '진행 중인 모든 리그를 조회하고 관리합니다.'}
            </p>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="bg-white rounded-xl shadow min-h-[600px]">
          
          {/* Case 1: 리그 목록 뷰 */}
          {!selectedLeague && (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">전체 리그 목록 ({leagueData?.totalCount || 0})</h2>
              </div>
              
              {leaguesLoading ? (
                <div className="p-12 text-center text-gray-400">로딩 중...</div>
              ) : (
                <div className="divide-y">
                  {leagueData?.leagues.map((league: LeagueInfo) => (
                    <button
                      key={league.leagueId}
                      onClick={() => handleLeagueClick(league)}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white
                          ${league.tier === 'BRONZE' ? 'bg-amber-700' : 
                            league.tier === 'SILVER' ? 'bg-gray-400' : 
                            league.tier === 'GOLD' ? 'bg-yellow-500' : 
                            league.tier === 'PLATINUM' ? 'bg-cyan-500' : 
                            league.tier === 'DIAMOND' ? 'bg-blue-600' : 'bg-purple-600'}
                        `}>
                          {league.tier.substring(0, 1)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-lg">{league.name}</p>
                          <div className="flex gap-2 text-sm text-gray-500 mt-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{league.category}</span>
                            <span>•</span>
                            <span>{league.currentMembers}명 참여</span>
                            <span>•</span>
                            <span>{league.startDate} ~ {league.endDate}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400" />
                    </button>
                  ))}
                  {leagueData?.leagues.length === 0 && (
                    <div className="p-12 text-center text-gray-400">진행 중인 리그가 없습니다.</div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Case 2: 리그 랭킹 상세 뷰 */}
          {selectedLeague && (
            <>
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 px-4">
                  <span className="w-16 text-center">순위</span>
                  <span className="flex-1">유저 정보</span>
                  <span className="w-32 text-center">상태</span>
                  <span className="w-24 text-center">관리</span>
                </div>
              </div>

              {rankingsLoading ? (
                <div className="p-12 text-center text-gray-400">랭킹 로딩 중...</div>
              ) : (
                <div className="divide-y max-h-[700px] overflow-y-auto">
                  {rankingData?.rankings.map((ranking: RankingInfo, index: number) => (
                    <div key={ranking.rankingId} className="p-4 flex items-center hover:bg-gray-50">
                      {/* 순위 */}
                      <div className="w-16 text-center font-bold text-lg text-gray-700">
                        {index + 1}
                      </div>
                      
                      {/* [수정] 유저 정보 (레벨 표시 추가) */}
                      <div className="flex-1 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          {/* 레벨 뱃지 */}
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
                            Lv.{ranking.level}
                          </span>
                          <p className="font-medium text-gray-900">{ranking.nickname}</p>
                        </div>
                        <p className="text-sm text-gray-400">ID: {ranking.memberId} | {ranking.socialId}</p>
                      </div>

                      {/* 상태 */}
                      <div className="w-32 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium
                          ${ranking.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        `}>
                          {ranking.status}
                        </span>
                      </div>

                      {/* 관리 버튼 */}
                      <div className="w-24 text-center">
                        {ranking.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleBanClick(ranking)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors tooltip"
                            title="랭킹에서 제외"
                          >
                            <Ban size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {rankingData?.rankings.length === 0 && (
                    <div className="p-12 text-center text-gray-400">랭킹 데이터가 없습니다.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 랭킹 제외 확인 모달 */}
      {isBanModalOpen && selectedRankingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <ShieldAlert size={32} />
              <h3 className="text-xl font-bold">랭킹 제외 확인</h3>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="font-medium text-gray-900 mb-1">
                대상 유저: <span className="text-blue-600">{selectedRankingMember.nickname}</span> (ID: {selectedRankingMember.memberId})
              </p>
              <p className="text-sm text-red-600 mt-2 leading-relaxed">
                이 유저를 랭킹 시스템에서 영구적으로 제외하시겠습니까?<br/>
                상태가 <b>RANKING_BANNED</b>로 변경되며, 이번 주 및 향후 랭킹 집계에서 제외됩니다.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsBanModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmBan}
                disabled={banMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                {banMutation.isPending ? '처리 중...' : '제외하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}