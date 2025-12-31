// API 응답 공통 타입
export interface CommonResponse<T> {
  data: T;
  message?: string;
}

// 페이징 응답
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 회원 관련 타입
export interface MemberSearchResult {
  memberId: number;
  nickname: string;
  socialType: string;
  status: string;
  createdAt: string;
}

export interface MemberDetail {
  memberId: number;
  nickname: string;
  socialType: string;
  status: string;
  currentLevel: number;
  profileMessage: string | null;
  school: string | null;
  schoolAddress: string | null;
  categoryMain: string | null;
  categorySub: string | null;
  gold: number;
  diamond: number;
  createdAt: string;
  lastLoginDateTime: string | null;
}

// 길드 관련 타입
export interface GuildDetail {
  guildId: number;
  name: string;
  description: string | null;
  category: string;
  isPublic: boolean;
  maxMembers: number;
  currentMembers: number;
  targetFocusTime: number;
  createdAt: string;
}

// 우편 관련 타입
export interface SendMailRequest {
  memberId: number;
  title: string;
  content: string;
  mailType: 'PURCHASE' | 'EVENT';
  gold?: number;
  diamond?: number;
  bonusTicketCount?: number;
}

export interface SendPreRegistrationRequest {
  memberId: number;
}

// 통계 관련 타입
export interface TimeRangeStats {
  label: string;
  minMinutes: number;
  maxMinutes: number;
  userCount: number;
  percentage: number;
}

export interface FocusTimeDistributionResponse {
  totalUsers: number;
  distribution: TimeRangeStats[];
}

export interface CategoryStats {
  category: string;
  categoryName: string;
  userCount: number;
  percentage: number;
}

export interface CategoryDistributionResponse {
  totalUsers: number;
  distribution: CategoryStats[];
}

export interface GenderStats {
  gender: string;
  genderName: string;
  userCount: number;
  percentage: number;
}

export interface GenderDistributionResponse {
  totalUsers: number;
  distribution: GenderStats[];
}

// 신고 관련 타입
export interface ReportItem {
  reportId: number;
  reportType: string;
  reportTypeName: string;
  reason: string | null;
  reportFromId: number;
  reportFromNickname: string;
  reportToId: number;
  reportToNickname: string;
  reportToProfileMessage: string | null;
  reportToTotalReportCount: number;
  createdAt: string;
}

export interface LeagueInfo {
  leagueId: number;
  seasonId: number;
  name: string;
  category: string;
  tier: string;
  currentWeek: number;
  startDate: string;
  endDate: string;
  currentMembers: number;
  isActive: boolean;
}

export interface RankingInfo {
  rankingId: number;
  memberId: number;
  level: number;
  nickname: string;
  socialId: string;
  status: string;
  tier: string;
}

export interface AdminLeagueResponse {
  leagues: LeagueInfo[];
  totalCount: number;
}

export interface AdminRankingResponse {
  leagueId: number;
  leagueName: string;
  leagueTier: string;
  totalMembers: number;
  rankings: RankingInfo[];
}