import React from 'react';
import { PlusIcon, CubeIcon, PencilIcon } from '@heroicons/react/24/outline';
import {
  AddButton,
  Header,
  SearchInput,
  Table,
  ActionButtons,
  Loader,
  AddStockModal,
  FilterSelect
} from '../../../components';
import NoRecordsAddButtonLayout from '../../common/NoRecordsAddButtonLayout';

function Products({
  products,
  loading,
  searchTerm,
  setSearchTerm,
  deleteProduct,
  filteredProducts,
  onAddStock,
  onEditStock,
  stockModal,
  onStockSubmit,
  onCloseStockModal,
  selectedCompany,
  setSelectedCompany,
  companyOptions
}) {
  const tableHeaders = ['Product Name', 'Company Name', 'Price', 'Current Stock', 'Stock Actions', 'Description', 'Actions'];

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <Header title="Products" buttons={[
        { to: "/products/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Product" }
      ]} />

      {/* Search and Filter */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput
            label="Search Products"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            label="Filter by Company"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            options={companyOptions}
            placeholder="All Companies"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Products List</h3>
            <div className="text-sm text-gray-600 mt-1">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <Table headers={tableHeaders}>
            {filteredProducts.map((product) => (
              <Table.Row key={product.id}>
                <Table.Cell className="font-medium text-gray-900">
                  {product.name}
                </Table.Cell>
                <Table.Cell>
                  {product.company_name || 'N/A'}
                </Table.Cell>
                <Table.Cell className="font-medium text-gray-900">
                  ₹{product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${product.current_stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {product.current_stock || 0}
                    </span>
                    {product.current_stock <= 10 && (
                      <span className="text-xs text-red-500">Low Stock</span>
                    )}
                  </div>
                </Table.Cell>
                {/* Stock Actions Column */}
                <Table.Cell>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => onAddStock(product)}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors"
                      title="Add Stock"
                    >
                      <CubeIcon className="h-3 w-3 mr-1" />
                      Add Stock
                    </button>
                    <button
                      onClick={() => onEditStock(product)}
                      className="flex items-center text-green-600 hover:text-green-700 text-xs font-medium px-3 py-1.5 rounded-md border border-green-200 hover:bg-green-50 transition-colors"
                      title="Edit Stock"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Edit Stock
                    </button>
                  </div>
                </Table.Cell>
                <Table.Cell className="max-w-xs">
                  {product.description ? (
                    <div className="truncate" title={product.description}>
                      {product.description}
                    </div>
                  ) : (
                    'No description'
                  )}
                </Table.Cell>
                <Table.Cell>
                  <ActionButtons
                    viewPath={null}
                    editPath={`/products/${product.id}/edit`}
                    onDelete={() => deleteProduct(product.id)}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm || selectedCompany ? 'No products found matching your filters.' : 'No products added yet.'}
            </div>
            {!searchTerm && !selectedCompany && (
              <NoRecordsAddButtonLayout>
                <AddButton title="Add First Product" link="/products/add" icon={<PlusIcon className="h-4 w-4 mr-2" />} />
              </NoRecordsAddButtonLayout>
            )}
          </div>
        )}
      </div>

      <AddStockModal
        isOpen={stockModal.isOpen}
        onClose={onCloseStockModal}
        product={stockModal.product}
        onSubmit={onStockSubmit}
        loading={stockModal.loading}
        mode={stockModal.mode}
        initialQuantity={stockModal.product?.current_stock || 0}
      />
    </div>
  );
}

export default Products;