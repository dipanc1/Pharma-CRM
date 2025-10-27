import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import Dashboard from './Dashboard'

const DashboardContainer = () => {
    const [selectedMonth, setSelectedMonth] = useState('current');
    const [stats, setStats] = useState({
        totalDoctors: 0,
        visitedDoctors: 0,
        visitPercentage: 0,
        totalSales: 0,
        totalProducts: 0
    });
    const [recentVisits, setRecentVisits] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [topDoctors, setTopDoctors] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth]);

    const getDateRange = () => {
        if (selectedMonth === 'overall') {
            return { startDate: null, endDate: null };
        } else if (selectedMonth === 'current') {
            const now = new Date();
            return {
                startDate: startOfMonth(now).toISOString().split('T')[0],
                endDate: endOfMonth(now).toISOString().split('T')[0]
            };
        } else {
            const year = parseInt(selectedMonth.split('-')[0]);
            const month = parseInt(selectedMonth.split('-')[1]) - 1;
            const date = new Date(year, month);
            return {
                startDate: startOfMonth(date).toISOString().split('T')[0],
                endDate: endOfMonth(date).toISOString().split('T')[0]
            };
        }
    };

    const fetchDashboardData = async () => {
        try {
            const { startDate, endDate } = getDateRange();
            const isOverall = selectedMonth === 'overall';

            // Fetch total doctors count
            const { count: totalDoctorsCount } = await supabase
                .from('doctors')
                .select('*', { count: 'exact' });

            const { count: totalProductsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact' });

            // Fetch visits for the selected period
            let visitsQuery = supabase
                .from('visits')
                .select('doctor_id, status');

            if (!isOverall) {
                visitsQuery = visitsQuery
                    .gte('visit_date', startDate)
                    .lte('visit_date', endDate);
            }

            const { data: visits } = await visitsQuery;

            // Calculate unique doctors visited
            const uniqueDoctorIds = new Set(visits?.map(v => v.doctor_id) || []);
            const visitedDoctorsCount = uniqueDoctorIds.size;

            // Calculate visit percentage
            const visitPercentage = totalDoctorsCount > 0 
                ? ((visitedDoctorsCount / totalDoctorsCount) * 100).toFixed(1)
                : 0;

            // Fetch sales count
            let salesQuery = supabase
                .from('sales')
                .select('*, visits!inner(visit_date)', { count: 'exact' });

            if (!isOverall) {
                salesQuery = salesQuery
                    .gte('visits.visit_date', startDate)
                    .lte('visits.visit_date', endDate);
            }

            const { count: salesCount } = await salesQuery;

            setStats({
                totalDoctors: totalDoctorsCount || 0,
                visitedDoctors: visitedDoctorsCount,
                visitPercentage: parseFloat(visitPercentage),
                totalSales: salesCount || 0,
                totalProducts: totalProductsCount || 0
            });

            // Fetch recent visits from selected period
            let recentVisitsQuery = supabase
                .from('visits')
                .select(`
                    *,
                    doctors (name)
                `)
                .order('visit_date', { ascending: false })
                .limit(5);

            if (!isOverall) {
                recentVisitsQuery = recentVisitsQuery
                    .gte('visit_date', startDate)
                    .lte('visit_date', endDate);
            }

            const { data: recentVisitsData } = await recentVisitsQuery;
            setRecentVisits(recentVisitsData || []);

            // Fetch sales data for charts
            let salesQueryForCharts = supabase
                .from('sales')
                .select(`
                    *,
                    visits!inner (visit_date),
                    products (name)
                `)
                .order('created_at', { ascending: false });

            if (!isOverall) {
                salesQueryForCharts = salesQueryForCharts
                    .gte('visits.visit_date', startDate)
                    .lte('visits.visit_date', endDate);
            }

            const { data: sales } = await salesQueryForCharts;

            // Process sales data for charts
            const salesByDate = {};
            sales?.forEach(sale => {
                const date = format(new Date(sale.visits.visit_date), 'MMM dd');
                salesByDate[date] = (salesByDate[date] || 0) + parseFloat(sale.total_amount);
            });

            const processedSalesData = Object.entries(salesByDate)
                .map(([date, amount]) => ({ date, amount }))
                .sort((a, b) => new Date(`2024 ${a.date}`) - new Date(`2024 ${b.date}`))
                .slice(-10);

            setSalesData(processedSalesData);

            // Fetch top doctors by sales
            let topDocsQuery = supabase
                .from('sales')
                .select(`
                    total_amount,
                    visits!inner (
                        visit_date,
                        doctors (name)
                    )
                `);

            if (!isOverall) {
                topDocsQuery = topDocsQuery
                    .gte('visits.visit_date', startDate)
                    .lte('visits.visit_date', endDate);
            }

            const { data: topDocs } = await topDocsQuery;

            const doctorSales = {};
            topDocs?.forEach(sale => {
                const doctorName = sale.visits.doctors.name;
                doctorSales[doctorName] = (doctorSales[doctorName] || 0) + parseFloat(sale.total_amount);
            });

            const topDoctorsData = Object.entries(doctorSales)
                .map(([name, total]) => ({ name, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            setTopDoctors(topDoctorsData);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const generateMonthOptions = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        const options = [
            { value: 'current', label: 'This Month', group: 'quick' },
            { value: 'overall', label: 'All Time', group: 'quick' }
        ];

        if (currentMonth > 0) {
            for (let month = currentMonth - 1; month >= 0; month--) {
                const date = new Date(currentYear, month, 1);
                const value = format(date, 'yyyy-MM');
                const label = format(date, 'MMMM yyyy');
                options.push({ value, label, group: 'thisYear' });
            }
        }

        return options;
    };

    return (
        <Dashboard
            stats={stats}
            recentVisits={recentVisits}
            salesData={salesData}
            topDoctors={topDoctors}
            COLORS={COLORS}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            monthOptions={generateMonthOptions()}
        />
    )
}

export default DashboardContainer