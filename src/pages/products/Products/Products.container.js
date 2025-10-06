import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import { handleAddStock, handleEditStock } from '../../../utils/stockUtils';
import useToast from '../../../hooks/useToast';
import Products from './Products';

function ProductsContainer() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [stockModal, setStockModal] = useState({
    isOpen: false,
    product: null,
    loading: false,
    mode: 'add'
  });

  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        showError('Error fetching products. Please try again.');
        return;
      }
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Error loading products. Please try again.');
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

        if (error) {
          showError('Error deleting product. Please try again.');
          return;
        }

        showSuccess('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        showError('Error deleting product');
      }
    }
  };

  const openAddStockModal = (product) => {
    setStockModal({
      isOpen: true,
      product: product,
      loading: false,
      mode: 'add'
    });
  };

  const openEditStockModal = (product) => {
    setStockModal({
      isOpen: true,
      product: product,
      loading: false,
      mode: 'edit'
    });
  };

  const closeStockModal = () => {
    setStockModal({
      isOpen: false,
      product: null,
      loading: false,
      mode: 'add'
    });
  };

  const handleStockSubmit = async (quantity, notes, mode) => {
    setStockModal(prev => ({ ...prev, loading: true }));

    try {
      let success = false;

      if (mode === 'edit') {
        success = await handleEditStock(stockModal.product.id, quantity, notes);
        if (success) {
          showSuccess(`Stock updated successfully for ${stockModal.product.name}!`);
        } else {
          showError('Error updating stock. Please try again.');
        }
      } else {
        success = await handleAddStock(stockModal.product.id, quantity, notes);
        if (success) {
          showSuccess(`Stock added successfully to ${stockModal.product.name}!`);
        } else {
          showError('Error adding stock. Please try again.');
        }
      }

      if (success) {
        closeStockModal();
        fetchProducts(); // Refresh the products list
      }
    } catch (error) {
      console.error('Error with stock operation:', error);
      showError('Error with stock operation. Please try again.');
    } finally {
      setStockModal(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <Products
        products={products}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        deleteProduct={deleteProduct}
        filteredProducts={filteredProducts}
        onAddStock={openAddStockModal}
        onEditStock={openEditStockModal}
        stockModal={stockModal}
        onStockSubmit={handleStockSubmit}
        onCloseStockModal={closeStockModal}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

export default ProductsContainer;