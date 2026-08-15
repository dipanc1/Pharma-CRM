import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import { handleAddStock, handleEditStock } from '../../../utils/stockUtils';
import useToast from '../../../hooks/useToast';
import useCompanies from '../../../hooks/useCompanies';
import useBillScan from '../../../hooks/useBillScan';
import Products from './Products';

function ProductsContainer() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  const [stockModal, setStockModal] = useState({
    isOpen: false,
    product: null,
    loading: false,
    mode: 'add'
  });

  const { toast, showSuccess, showError, hideToast } = useToast();
  const { companiesOptions, companies, refreshCompanies } = useCompanies();
  const fileInputRef = useRef(null);

  const bill = useBillScan({
    products,
    companies,
    onSaved: async () => {
      await Promise.all([fetchProducts(), refreshCompanies()]);
    }
  });

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const result = bill.saveResult;
    if (!result) return;

    const { savedCount, totalCount, failures, cashFlowSaved, cashFlowExpected } = result;

    if (savedCount === 0) {
      showError('Nothing was imported. Please try again.');
    } else if (failures.length > 0) {
      showError(`Imported ${savedCount} of ${totalCount} items. Failed: ${failures.join(', ')}`);
    } else if (cashFlowExpected && !cashFlowSaved) {
      showError(`Stock updated for ${savedCount} items, but the cash outflow was not recorded. Add it manually in Cash Flow.`);
    } else {
      showSuccess(`Imported ${savedCount} item${savedCount === 1 ? '' : 's'} from the bill.`);
    }

    bill.clearSaveResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill.saveResult]);

  const handleBillFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await bill.scanBill(file);
  };

  const openBillPicker = () => fileInputRef.current?.click();

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany = !selectedCompany || product.company_name === selectedCompany;

    return matchesSearch && matchesCompany;
  });

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
        fetchProducts();
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
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        companyOptions={companiesOptions}
        bill={bill}
        companies={companies}
        fileInputRef={fileInputRef}
        onUploadBill={openBillPicker}
        onBillFileChange={handleBillFileChange}
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