'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/lib/api';
import { AlertTriangle, ChevronLeft, ChevronRight, User } from 'lucide-react';
import type { ReportItem, PageResponse } from '@/types';
import { format } from 'date-fns';

export default function ReportsPage() {
  const [page, setPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const pageSize = 20;

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', page],
    queryFn: async () => {
      const res = await reportApi.getList(page, pageSize);
      return res.data.data as PageResponse<ReportItem>;
    },
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">신고 목록</h1>
          <p className="text-gray-500 mt-1">유저 신고 내역을 확인합니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 신고 목록 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={20} />
                <h2 className="font-semibold text-gray-900">신고 내역</h2>
              </div>
              {reportData && (
                <span className="text-sm text-gray-500">
                  총 {reportData.totalElements}건
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-gray-400">로딩 중...</div>
            ) : !reportData?.content?.length ? (
              <div className="p-8 text-center text-gray-400">
                신고 내역이 없습니다.
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {reportData.content.map((report: ReportItem) => (
                    <button
                      key={report.reportId}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedReport?.reportId === report.reportId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={20} className="text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {report.reportToNickname}
                              <span className="ml-2 text-sm text-red-500">
                                (누적 {report.reportToTotalReportCount}회)
                              </span>
                            </p>
                            <p className="text-sm text-gray-500">
                              {report.reportTypeName}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              신고자: {report.reportFromNickname}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* 페이지네이션 */}
                <div className="p-4 border-t flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                    이전
                  </button>
                  <span className="text-sm text-gray-500">
                    {page + 1} / {reportData.totalPages || 1}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (reportData.totalPages || 1) - 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 신고 상세 정보 */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">신고 상세</h2>
            </div>

            {!selectedReport ? (
              <div className="p-8 text-center text-gray-400">
                왼쪽에서 신고를 선택해주세요.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* 피신고자 정보 */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">피신고자</p>
                  <p className="text-lg font-semibold mt-1">{selectedReport.reportToNickname}</p>
                  <p className="text-sm text-gray-500">ID: {selectedReport.reportToId}</p>
                  <p className="text-sm text-red-500 mt-1">
                    누적 신고: {selectedReport.reportToTotalReportCount}회
                  </p>
                </div>

                {/* 상태메시지 */}
                {selectedReport.reportToProfileMessage && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">피신고자 상태메시지</p>
                    <p className="font-medium mt-1 text-red-600">
                      "{selectedReport.reportToProfileMessage}"
                    </p>
                  </div>
                )}

                {/* 신고 정보 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">신고 유형</p>
                  <p className="font-medium">{selectedReport.reportTypeName}</p>
                </div>

                {selectedReport.reason && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">신고 사유</p>
                    <p className="font-medium">{selectedReport.reason}</p>
                  </div>
                )}

                {/* 신고자 정보 */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">신고자</p>
                  <p className="font-medium mt-1">{selectedReport.reportFromNickname}</p>
                  <p className="text-sm text-gray-500">ID: {selectedReport.reportFromId}</p>
                </div>

                {/* 신고 일시 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">신고 일시</p>
                  <p className="font-medium">{formatDate(selectedReport.createdAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
