import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import Dashboard from './Dashboard'

const DashboardContainer = () => {
    const [selectedMonth, setSelectedMonth] = useState('current');
    const [stats, setStats] = useState({
        totalDoctors: 0,
        totalChemists: 0,
        totalContacts: 0,
        visitedDoctors: 0,
        visitPercentage: 0,
        totalSales: 0,
        totalProducts: 0
    });
    const [recentVisits, setRecentVisits] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [topContacts, setTopContacts] = useState([]);

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

            // Fetch all contacts with their types
            const { data: allContacts } = await supabase
                .from('doctors')
                .select('id, contact_type');

            const totalDoctors = allContacts?.filter(c => c.contact_type === 'doctor').length || 0;
            const totalChemists = allContacts?.filter(c => c.contact_type === 'chemist').length || 0;
            const totalContacts = allContacts?.length || 0;

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

            // Calculate unique contacts visited
            const uniqueContactIds = new Set(visits?.map(v => v.doctor_id) || []);
            const visitedContactsCount = uniqueContactIds.size;

            // Calculate visit percentage
            const visitPercentage = totalContacts > 0 
                ? ((visitedContactsCount / totalContacts) * 100).toFixed(1)
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
                totalDoctors,
                totalChemists,
                totalContacts,
                visitedDoctors: visitedContactsCount,
                visitPercentage: parseFloat(visitPercentage),
                totalSales: salesCount || 0,
                totalProducts: totalProductsCount || 0
            });

            // Fetch recent visits from selected period
            let recentVisitsQuery = supabase
                .from('visits')
                .select(`
                    *,
                    doctors (name, contact_type)
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

            // Fetch top contacts by sales
            let topContactsQuery = supabase
                .from('sales')
                .select(`
                    total_amount,
                    visits!inner (
                        visit_date,
                        doctors (name, contact_type)
                    )
                `);

            if (!isOverall) {
                topContactsQuery = topContactsQuery
                    .gte('visits.visit_date', startDate)
                    .lte('visits.visit_date', endDate);
            }

            const { data: topContactsData } = await topContactsQuery;

            const contactSales = {};
            topContactsData?.forEach(sale => {
                const contactName = sale.visits.doctors.name;
                const contactType = sale.visits.doctors.contact_type;
                const key = `${contactName}|${contactType}`;
                
                if (!contactSales[key]) {
                    contactSales[key] = {
                        name: contactName,
                        contact_type: contactType,
                        total: 0
                    };
                }
                contactSales[key].total += parseFloat(sale.total_amount);
            });

            const topContactsProcessed = Object.values(contactSales)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            setTopContacts(topContactsProcessed);

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
            topContacts={topContacts}
            COLORS={COLORS}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            monthOptions={generateMonthOptions()}
        />
    )
}

export default DashboardContainer