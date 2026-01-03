'use client';

import { useState } from 'react';
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
  Legend,
} from 'recharts';
import { Calendar } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#14B8A6', '#A855F7', '#D946EF'];

interface CategoryItem {
  categoryName: string;
  userCount: number;
  percentage: number;
}

interface GenderItem {
  genderName: string;
  userCount: number;
  percentage: number;
}

export default function StatsPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statType, setStatType] = useState<'daily' | 'weekly'>('daily');

  const { data: focusData, isLoading: focusLoading } = useQuery({
    queryKey: ['focusDistribution', statType, selectedDate],
    queryFn: async () => {
      const res = statType === 'daily'
        ? await statsApi.getDailyFocusDistribution()
        : await statsApi.getWeeklyFocusDistribution(selectedDate);
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

  const renderCategoryLabel = (props: { payload?: CategoryItem; percent?: number }) => {
    const { payload, percent } = props;
    if (!payload || !percent || percent < 0.05) return null;
    return `${payload.categoryName}`;
  };

  const renderGenderLabel = (props: { payload?: GenderItem; percent?: number }) => {
    const { payload, percent } = props;
    if (!payload || !percent) return null;
    return `${payload.genderName} (${(percent * 100).toFixed(1)}%)`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통계</h1>
          <p className="text-gray-500 mt-1">유저 통계를 확인합니다.</p>
        </div>

        {/* 집중시간 분포 */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-semibold text-gray-900">집중시간 분포</h2>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setStatType('daily')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statType === 'daily'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  일간
                </button>
                <button
                  onClick={() => setStatType('weekly')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statType === 'weekly'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  주간
                </button>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {focusLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-400">
                로딩 중...
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    총 유저: <span className="font-semibold text-gray-900">{focusData?.totalUsers ?? 0}명</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    {statType === 'daily' ? '일간' : '주간'} 집중시간 분포 ({selectedDate})
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={focusData?.distribution || []} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="userCount" fill="#3B82F6" name="유저 수" />
                  </BarChart>
                </ResponsiveContainer>

                {/* 상세 테이블 */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">시간대</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">유저 수</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">비율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {focusData?.distribution?.map((item: { label: string; userCount: number; percentage: number }, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3">{item.label}</td>
                          <td className="text-right py-2 px-3 font-medium">{item.userCount}명</td>
                          <td className="text-right py-2 px-3 text-gray-500">{item.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 카테고리 & 성별 분포 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 카테고리 분포 */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">카테고리 분포</h2>
              <p className="text-sm text-gray-500 mt-1">
                총 {categoryData?.totalUsers ?? 0}명
              </p>
            </div>
            <div className="p-6">
              {categoryLoading ? (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  로딩 중...
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData?.distribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="userCount"
                        nameKey="categoryName"
                        label={renderCategoryLabel}
                      >
                        {categoryData?.distribution?.map((_: unknown, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* 카테고리 테이블 */}
                  <div className="mt-4 max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-gray-500">카테고리</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">유저 수</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">비율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryData?.distribution?.map((item: CategoryItem, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              {item.categoryName}
                            </td>
                            <td className="text-right py-2 px-3 font-medium">{item.userCount}명</td>
                            <td className="text-right py-2 px-3 text-gray-500">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 성별 분포 */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">성별 분포</h2>
              <p className="text-sm text-gray-500 mt-1">
                총 {genderData?.totalUsers ?? 0}명
              </p>
            </div>
            <div className="p-6">
              {genderLoading ? (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  로딩 중...
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderData?.distribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="userCount"
                        nameKey="genderName"
                        label={renderGenderLabel}
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#EC4899" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* 성별 테이블 */}
                  <div className="mt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-gray-500">성별</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">유저 수</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">비율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {genderData?.distribution?.map((item: GenderItem, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: index === 0 ? '#3B82F6' : '#EC4899' }}
                              />
                              {item.genderName}
                            </td>
                            <td className="text-right py-2 px-3 font-medium">{item.userCount}명</td>
                            <td className="text-right py-2 px-3 text-gray-500">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
