import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

import Dashboard from './Dashboard'

const DashboardContainer = () => {
    const [stats, setStats] = useState({
        totalDoctors: 0,
        totalVisits: 0,
        totalSales: 0,
        totalProducts: 0
    });
    const [recentVisits, setRecentVisits] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [topDoctors, setTopDoctors] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch statistics
            const [doctorsCount, visitsCount, salesCount, productsCount] = await Promise.all([
                supabase.from('doctors').select('*', { count: 'exact' }),
                supabase.from('visits').select('*', { count: 'exact' }),
                supabase.from('sales').select('*', { count: 'exact' }),
                supabase.from('products').select('*', { count: 'exact' })
            ]);

            setStats({
                totalDoctors: doctorsCount.count || 0,
                totalVisits: visitsCount.count || 0,
                totalSales: salesCount.count || 0,
                totalProducts: productsCount.count || 0
            });

            // Fetch recent visits with doctor names
            const { data: visits } = await supabase
                .from('visits')
                .select(`
              *,
              doctors (name)
            `)
                .order('visit_date', { ascending: false })
                .limit(5);

            setRecentVisits(visits || []);

            // Fetch sales data for charts
            const { data: sales } = await supabase
                .from('sales')
                .select(`
              *,
              visits (visit_date),
              products (name)
            `)
                .order('created_at', { ascending: false })
                .limit(10);

            // Process sales data for charts
            const processedSalesData = sales?.map(sale => ({
                date: format(new Date(sale.visits.visit_date), 'MMM dd'),
                amount: parseFloat(sale.total_amount)
            })) || [];

            setSalesData(processedSalesData);

            // Fetch top doctors by sales
            const { data: topDocs } = await supabase
                .from('sales')
                .select(`
              total_amount,
              visits (
                doctors (name)
              )
            `);

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

    return (
        <Dashboard stats={stats} recentVisits={recentVisits} salesData={salesData} topDoctors={topDoctors} COLORS={COLORS} />
    )
}

export default DashboardContainer