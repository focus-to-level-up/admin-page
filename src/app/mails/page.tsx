'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { memberApi, mailApi } from '@/lib/api';
import { Search, Send, Gift, User } from 'lucide-react';
import type { MemberSearchResult } from '@/types';

export default function MailsPage() {
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberNickname, setSelectedMemberNickname] = useState('');

  // 보상 우편 폼 (백엔드 API 필드명에 맞춤)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupContent, setPopupContent] = useState('');
  const [goldAmount, setGoldAmount] = useState(0);
  const [diamondAmount, setDiamondAmount] = useState(0);
  const [bonusTicketCount, setBonusTicketCount] = useState(0);
  const [expireDays, setExpireDays] = useState(30);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['memberSearch', searchKeyword],
    queryFn: async () => {
      if (!searchKeyword) return { content: [] };
      const res = await memberApi.search(searchKeyword);
      return res.data.data;
    },
    enabled: !!searchKeyword,
  });

  const sendRewardMutation = useMutation({
    mutationFn: mailApi.sendReward,
    onSuccess: () => {
      alert('보상 우편이 발송되었습니다.');
      resetForm();
    },
    onError: (error: Error) => {
      alert(`발송 실패: ${error.message}`);
    },
  });

  const sendPreRegistrationMutation = useMutation({
    mutationFn: mailApi.sendPreRegistration,
    onSuccess: () => {
      alert('사전등록 패키지가 발송되었습니다.');
    },
    onError: (error: Error) => {
      alert(`발송 실패: ${error.message}`);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(keyword);
  };

  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMemberId(member.memberId);
    setSelectedMemberNickname(member.nickname);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPopupTitle('');
    setPopupContent('');
    setGoldAmount(0);
    setDiamondAmount(0);
    setBonusTicketCount(0);
    setExpireDays(30);
  };

  const handleSendReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert('회원을 선택해주세요.');
      return;
    }
    if (!title || !description) {
      alert('제목과 설명을 입력해주세요.');
      return;
    }
    if (goldAmount === 0 && diamondAmount === 0 && bonusTicketCount === 0) {
      alert('최소 하나의 보상을 설정해주세요.');
      return;
    }

    sendRewardMutation.mutate({
      receiverId: selectedMemberId,
      title,
      description,
      popupTitle: popupTitle || undefined,
      popupContent: popupContent || undefined,
      goldAmount: goldAmount > 0 ? goldAmount : undefined,
      diamondAmount: diamondAmount > 0 ? diamondAmount : undefined,
      bonusTicketCount: bonusTicketCount > 0 ? bonusTicketCount : undefined,
      expireDays,
    });
  };

  const handleSendPreRegistration = () => {
    if (!selectedMemberId) {
      alert('회원을 선택해주세요.');
      return;
    }
    if (confirm(`${selectedMemberNickname}님에게 사전등록 패키지를 발송하시겠습니까?`)) {
      sendPreRegistrationMutation.mutate(selectedMemberId);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">우편 발송</h1>
          <p className="text-gray-500 mt-1">회원에게 보상 우편을 발송합니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 회원 검색 */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">회원 검색</h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="닉네임 또는 ID"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  검색
                </button>
              </form>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-400">검색 중...</div>
              ) : !searchResults?.content?.length ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {searchKeyword ? '검색 결과 없음' : '회원을 검색하세요'}
                </div>
              ) : (
                searchResults.content.map((member: MemberSearchResult) => (
                  <button
                    key={member.memberId}
                    onClick={() => handleSelectMember(member)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedMemberId === member.memberId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{member.nickname}</p>
                        <p className="text-xs text-gray-500">ID: {member.memberId}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 보상 우편 작성 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">보상 우편 작성</h2>
              {selectedMemberId && (
                <p className="text-sm text-blue-600 mt-1">
                  받는 사람: {selectedMemberNickname} (ID: {selectedMemberId})
                </p>
              )}
            </div>
            <form onSubmit={handleSendReward} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="우편 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명 *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="우편 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    팝업 제목 (선택)
                  </label>
                  <input
                    type="text"
                    value={popupTitle}
                    onChange={(e) => setPopupTitle(e.target.value)}
                    placeholder="팝업 제목"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    만료일 (일)
                  </label>
                  <input
                    type="number"
                    value={expireDays}
                    onChange={(e) => setExpireDays(parseInt(e.target.value) || 30)}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  팝업 내용 (선택)
                </label>
                <textarea
                  value={popupContent}
                  onChange={(e) => setPopupContent(e.target.value)}
                  placeholder="팝업 내용"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    골드
                  </label>
                  <input
                    type="number"
                    value={goldAmount}
                    onChange={(e) => setGoldAmount(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    다이아
                  </label>
                  <input
                    type="number"
                    value={diamondAmount}
                    onChange={(e) => setDiamondAmount(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    보너스 티켓
                  </label>
                  <input
                    type="number"
                    value={bonusTicketCount}
                    onChange={(e) => setBonusTicketCount(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={sendRewardMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                  {sendRewardMutation.isPending ? '발송 중...' : '보상 우편 발송'}
                </button>
              </div>
            </form>

            {/* 사전등록 패키지 */}
            <div className="p-4 border-t bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-3">사전등록 패키지</h3>
              <p className="text-sm text-gray-500 mb-3">
                사전등록 보상 패키지를 일괄 발송합니다. (다이아 3000개 + 캐릭터 선택권)
              </p>
              <button
                onClick={handleSendPreRegistration}
                disabled={!selectedMemberId || sendPreRegistrationMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Gift size={18} />
                {sendPreRegistrationMutation.isPending ? '발송 중...' : '사전등록 패키지 발송'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
