import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prod.api.studio-edge.app';
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// plz

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 회원 API
export const memberApi = {// [수정] 검색 API (type, keyword)
  search: (type: string, keyword: string) => 
    api.get(`/api/v1/admin/members/search?type=${type}&keyword=${keyword}`),

  getDetail: (memberId: number) =>
    api.get(`/api/v1/admin/members/${memberId}`),

  getStats: (memberId: number, startDate: string, endDate: string) => 
    api.get(`/api/v1/admin/members/${memberId}/stats?startDate=${startDate}&endDate=${endDate}`),

  updateNickname: (memberId: number, nickname: string) =>
    api.put(`/api/v1/admin/members/${memberId}/nickname`, { nickname }),

  updateProfileMessage: (memberId: number, profileMessage: string) =>
    api.put(`/api/v1/admin/members/${memberId}/profile-message`, { profileMessage }),

  updateSchool: (memberId: number, school: string, schoolAddress?: string) =>
    api.put(`/api/v1/admin/members/${memberId}/school`, { school, schoolAddress }),

  banMember: (memberId: number) =>
    api.post(`/api/v1/admin/rankings/${memberId}/exclude`),

  restoreMember: (memberId: number) => 
    api.put(`/api/v1/admin/members/${memberId}/restore`),
};

// 우편 API
export const mailApi = {
  sendReward: (data: {
    receiverId: number;
    title: string;
    description: string;
    popupTitle?: string;
    popupContent?: string;
    diamondAmount?: number;
    goldAmount?: number;
    bonusTicketCount?: number;
    expireDays?: number;
  }) => api.post(`/api/v1/admin/mails`, data),

  sendPreRegistration: (memberId: number) =>
    api.post(`/api/v1/admin/mails/pre-registration`, { receiverId: memberId }),
};

// 길드 API
export const guildApi = {
  getDetail: (guildId: number) =>
    api.get(`/api/v1/admin/guilds/${guildId}`),

  updateName: (guildId: number, name: string) =>
    api.put(`/api/v1/admin/guilds/${guildId}/name`, { name }),

  updateDescription: (guildId: number, description: string) =>
    api.put(`/api/v1/admin/guilds/${guildId}/description`, { description }),
};

// 통계 API
export const statsApi = {
  getDailyFocusDistribution: (date: string) =>
    api.get(`/api/v1/admin/stats/focus-time/daily`, { params: { date } }),

  getWeeklyFocusDistribution: (date: string) =>
    api.get(`/api/v1/admin/stats/focus-time/weekly`, { params: { date } }),

  getCategoryDistribution: () =>
    api.get(`/api/v1/admin/stats/category`),

  getGenderDistribution: () =>
    api.get(`/api/v1/admin/stats/gender`),
};

// 신고 API
export const reportApi = {
  getList: (page = 0, size = 20) =>
    api.get(`/api/v1/admin/reports`, { params: { page, size } }),
};
// 리그 & 랭킹 API (수정됨)
export const leagueApi = {
  // 1. 리그 전체 조회
  getLeagues: () => 
    api.get('/api/v1/admin/leagues'),

  // 2. 특정 리그의 랭킹 조회
  getRankingsByLeague: (leagueId: number) =>
    api.get(`/api/v1/admin/leagues/${leagueId}/rankings`),

  // 3. 유저 랭킹 제외 (밴) 처리
  banMemberFromRanking: (memberId: number) =>
    api.post(`/api/v1/admin/rankings/${memberId}/exclude`),
};