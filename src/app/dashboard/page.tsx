'use client';

import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/api';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

interface CategoryItem {
  categoryName: string;
  count: number;
  percentage: number;
}

export default function DashboardPage() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['dailyFocusDistribution', today],
    queryFn: async () => {
      const res = await statsApi.getDailyFocusDistribution(today);
      return res.data.data;
    },
  });

  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ['categoryDistribution'],
    queryFn: async () => {
      const res = await statsApi.getCategoryDistribution();
      return res.data.data;
    },
  });

  const { data: genderData, isLoading: genderLoading } = useQuery({
    queryKey: ['genderDistribution'],
    queryFn: async () => {
      const res = await statsApi.getGenderDistribution();
      return res.data.data;
    },
  });

  const renderCustomLabel = (props: { payload?: CategoryItem; percent?: number }) => {
    const { payload, percent } = props;
    if (!payload || !percent || percent < 0.05) return null;
    return `${payload.categoryName}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500 mt-1">주요 통계를 한눈에 확인하세요.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">오늘 활동 유저</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {dailyLoading ? '-' : dailyData?.totalUsers ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">전체 유저</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {categoryLoading ? '-' : categoryData?.totalUsers ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">성별 분포</h3>
            <div className="flex gap-4 mt-2">
              {genderLoading ? (
                <span className="text-gray-400">-</span>
              ) : (
                genderData?.distribution?.map((g: { genderName: string; percentage: number }) => (
                  <span key={g.genderName} className="text-sm text-gray-600">
                    {g.genderName}: {g.percentage}%
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 일간 집중시간 분포 */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              일간 집중시간 분포 ({today})
            </h3>
            {dailyLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                로딩 중...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData?.distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="userCount" fill="#3B82F6" name="유저 수" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 카테고리 분포 */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              카테고리 분포
            </h3>
            {categoryLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                로딩 중...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData?.distribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="categoryName"
                  >
                    {categoryData?.distribution?.map((_: unknown, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
