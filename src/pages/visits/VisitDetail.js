import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchVisitData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          doctors (name, specialization, hospital),
          sales (
            id,
            quantity,
            unit_price,
            total_amount,
            products (name, category)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setVisit(data);

    } catch (error) {
      console.error('Error fetching visit data:', error);
      alert('Error loading visit details');
    } finally {
      setLoading(false);
    }
  };

  const deleteVisit = async () => {
    if (window.confirm('Are you sure you want to delete this visit? This will also delete all associated sales.')) {
      try {
        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('id', id);

        if (error) throw error;
        alert('Visit deleted successfully');
        navigate('/visits');
      } catch (error) {
        console.error('Error deleting visit:', error);
        alert('Error deleting visit');
      }
    }
  };

  const calculateTotalSales = (sales) => {
    return sales?.reduce((total, sale) => total + parseFloat(sale.total_amount), 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Visit not found</div>
        <Link to="/visits" className="btn-primary mt-4 inline-flex">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Visits
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/visits')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Visit Details</h1>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/visits/${id}/edit`}
            className="btn-secondary flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={deleteVisit}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <TrashIcon className="h-4 w-4 mr-2 inline" />
            Delete
          </button>
        </div>
      </div>

      {/* Visit Information */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Visit Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Doctor</label>
            <p className="mt-1 text-sm text-gray-900">{visit.doctors?.name}</p>
            <p className="text-xs text-gray-500">{visit.doctors?.specialization} • {visit.doctors?.hospital}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Visit Date</label>
            <p className="mt-1 text-sm text-gray-900">{format(new Date(visit.visit_date), 'MMMM dd, yyyy')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
              visit.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {visit.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Total Sales</label>
                         <p className="mt-1 text-lg font-semibold text-gray-900">₹{calculateTotalSales(visit.sales).toFixed(2)}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500">Notes</label>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
              {visit.notes || 'No notes recorded'}
            </p>
          </div>
        </div>
      </div>

      {/* Sales Items */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sales Items</h2>
        
        {visit.sales && visit.sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Quantity</th>
                  <th className="table-header">Unit Price</th>
                  <th className="table-header">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visit.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{sale.products?.name}</td>
                    <td className="table-cell text-gray-500">{sale.products?.category || 'N/A'}</td>
                    <td className="table-cell">{sale.quantity}</td>
                                         <td className="table-cell">₹{parseFloat(sale.unit_price).toFixed(2)}</td>
                     <td className="table-cell font-medium">₹{parseFloat(sale.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">No sales recorded for this visit</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisitDetail;
