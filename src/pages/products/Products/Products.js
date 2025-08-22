import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { 
  AddButton, 
  Header, 
  SearchInput,
  Table, 
  ActionButtons,
  Loader
} from '../../../components';
import NoRecordsAddButtonLayout from '../../common/NoRecordsAddButtonLayout';

function Products({
  products,
  loading,
  searchTerm,
  setSearchTerm,
  deleteProduct,
  filteredProducts
}) {
  const tableHeaders = ['Product Name', 'Category', 'Price', 'Description', 'Actions'];

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <Header title="Products" buttons={[
        { to: "/products/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Product" }
      ]} />

      {/* Search */}
      <div className="card">
        <div className="max-w-md">
          <SearchInput
            label="Search Products"
            placeholder="Search by name, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                  {product.category || 'N/A'}
                </Table.Cell>
                <Table.Cell className="font-medium text-gray-900">
                  ₹{product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
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
                    editPath={`/products/${product.id}/edit`}
                    onDelete={() => deleteProduct(product.id)}
                    showView={false}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm ? 'No products found matching your search.' : 'No products added yet.'}
            </div>
            {!searchTerm && (
              <NoRecordsAddButtonLayout>
                <AddButton title="Add First Product" link="/products/add" icon={<PlusIcon className="h-4 w-4 mr-2" />} />
              </NoRecordsAddButtonLayout>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;