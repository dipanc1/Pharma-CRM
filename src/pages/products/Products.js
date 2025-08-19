import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link to="/products/add" className="btn-primary flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <input
            type="text"
            id="search"
            className="input-field"
            placeholder="Search by name, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Product Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Price</th>
                <th className="table-header">Description</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="table-cell text-gray-500">
                    {product.category || 'N/A'}
                  </td>
                  <td className="table-cell">
                    <span className="font-medium text-gray-900">
                      ₹{product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500 max-w-xs">
                    {product.description ? (
                      <div className="truncate" title={product.description}>
                        {product.description}
                      </div>
                    ) : (
                      'No description'
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="text-gray-600 hover:text-gray-700"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No products found matching your search.' : 'No products added yet.'}
            </div>
            {!searchTerm && (
              <Link to="/products/add" className="btn-primary mt-4 inline-flex">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Product
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
