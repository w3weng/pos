import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../store/index';
import { productService, categoryService } from '../services/api';
import toast from 'react-hot-toast';
import { Card, Button, Input, LoadingSpinner, Badge, Table } from '../components/ui';
import { formatCurrency, resolveImageUrl } from '../utils/helpers';
import { FiEdit2, FiPlus } from 'react-icons/fi';

const PRODUCT_FETCH_LIMIT = 1000;

const createInitialFormData = () => ({
    name: '',
    description: '',
    categoryId: '',
    sku: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    imageUrl: '',
    isAvailable: true,
});

const createInitialCategoryData = () => ({
    name: '',
    description: '',
});

const mapProductToFormData = (product) => ({
    name: product.name || '',
    description: product.description || '',
    categoryId: product.category_id ? String(product.category_id) : '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    purchasePrice: product.purchase_price ?? '',
    sellingPrice: product.selling_price ?? '',
    imageUrl: product.image_url || '',
    isAvailable: Number(product.is_available ?? product.is_active ?? 1) > 0,
});

const buildProductPayload = (formData) => ({
    name: formData.name,
    description: formData.description,
    categoryId: formData.categoryId,
    sku: formData.sku,
    barcode: formData.barcode,
    purchasePrice: formData.purchasePrice,
    sellingPrice: formData.sellingPrice,
    imageUrl: formData.imageUrl,
    isAvailable: formData.isAvailable,
});

const isProductAvailable = (product) => Number(product.is_available ?? product.is_active ?? 1) > 0;

const fetchProducts = async (search = '') => {
    const response = await productService.getProducts({ search, limit: PRODUCT_FETCH_LIMIT });
    return response.data.data;
};

const ProductsPage = () => {
    const { isDark } = useThemeStore();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(createInitialFormData);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryFormData, setCategoryFormData] = useState(createInitialCategoryData);
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [togglingProductId, setTogglingProductId] = useState(null);
    const totalProducts = products.length;
    const availableProducts = products.filter(isProductAvailable).length;
    const notAvailableProducts = totalProducts - availableProducts;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    fetchProducts(search),
                    categoryService.getCategories(),
                ]);
                setProducts(prodRes);
                setCategories(catRes.data.data);
            } catch (error) {
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [search]);

    const closeProductForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(createInitialFormData());
        setShowCategoryForm(false);
        setCategoryFormData(createInitialCategoryData());
        setUploadingImage(false);
    };

    const isAddingCategory = showCategoryForm || categories.length === 0;

    const handleCreateCategory = async () => {
        const name = categoryFormData.name.trim();

        if (!name) {
            toast.error('Category name required');
            return;
        }

        setCreatingCategory(true);

        try {
            const payload = {
                name,
                description: categoryFormData.description.trim(),
            };
            const response = await categoryService.createCategory(payload);
            const newCategory = {
                id: response.data.data.id,
                ...payload,
            };

            setCategories((currentCategories) =>
                [...currentCategories, newCategory].sort((left, right) => left.name.localeCompare(right.name))
            );
            setFormData((currentFormData) => ({
                ...currentFormData,
                categoryId: String(newCategory.id),
            }));
            setShowCategoryForm(false);
            setCategoryFormData(createInitialCategoryData());
            toast.success('Category created');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create category');
        } finally {
            setCreatingCategory(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (showCategoryForm) {
            toast.error('Save or cancel the new category first');
            return;
        }

        if (!formData.categoryId) {
            toast.error(isAddingCategory ? 'Create a category first' : 'Select a category');
            return;
        }

        try {
            const payload = buildProductPayload(formData);

            if (editingId) {
                await productService.updateProduct(editingId, payload);
                toast.success('Product updated');
            } else {
                await productService.createProduct(payload);
                toast.success('Product created');
            }

            closeProductForm();

            // Refresh products
            setProducts(await fetchProducts(search));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleAvailabilityToggle = async (product) => {
        const nextAvailability = !isProductAvailable(product);
        const nextStatusLabel = nextAvailability ? 'Available' : 'Not Available';

        try {
            setTogglingProductId(product.id);
            setProducts((currentProducts) =>
                currentProducts.map((currentProduct) =>
                    currentProduct.id === product.id
                        ? {
                            ...currentProduct,
                            is_available: nextAvailability ? 1 : 0,
                            is_active: nextAvailability ? 1 : 0,
                        }
                        : currentProduct
                )
            );
            await productService.updateProduct(product.id, {
                ...buildProductPayload(mapProductToFormData(product)),
                isAvailable: nextAvailability,
            });
            toast.success(`${product.name} marked as ${nextStatusLabel}`);
            setProducts(await fetchProducts(search));
        } catch (error) {
            setProducts(await fetchProducts(search));
            toast.error(error.response?.data?.message || 'Failed to update availability');
        } finally {
            setTogglingProductId(null);
        }
    };

    const handleEdit = (product) => {
        setEditingId(product.id);
        setFormData(mapProductToFormData(product));
        setShowCategoryForm(false);
        setCategoryFormData(createInitialCategoryData());
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        setUploadingImage(true);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);

            const response = await productService.uploadImage(uploadFormData);
            setFormData((currentFormData) => ({
                ...currentFormData,
                imageUrl: response.data.data.imageUrl,
            }));
            toast.success('Product image uploaded');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-6 py-4 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Products</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage your product catalog and product availability</p>
                </div>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                        setEditingId(null);
                        if (showForm) {
                            closeProductForm();
                            return;
                        }

                        setFormData(createInitialFormData());
                        setShowCategoryForm(false);
                        setCategoryFormData(createInitialCategoryData());
                        setShowForm(true);
                    }}
                    className="w-full sm:w-auto"
                >
                    <FiPlus /> {showForm ? 'Close Form' : 'Add Product'}
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card isDark={isDark} className="p-4">
                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Products</p>
                    <p className={`mt-1 text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalProducts}</p>
                </Card>
                <Card isDark={isDark} className="p-4">
                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Available</p>
                    <p className="mt-1 text-3xl font-black text-emerald-600">{availableProducts}</p>
                </Card>
                <Card isDark={isDark} className="p-4">
                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Not Available</p>
                    <p className="mt-1 text-3xl font-black text-amber-600">{notAvailableProducts}</p>
                </Card>
            </div>

            {/* Search */}
            <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                isDark={isDark}
            />

            {/* Form */}
            {showForm && (
                <Card isDark={isDark}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {editingId ? 'Edit Product' : 'New Product'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Product Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            isDark={isDark}
                            required
                        />

                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Category
                                </label>
                                {categories.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setShowCategoryForm((currentValue) => !currentValue);
                                            setCategoryFormData(createInitialCategoryData());
                                        }}
                                    >
                                        {isAddingCategory ? 'Use Existing' : 'Add Category'}
                                    </Button>
                                )}
                            </div>

                            {isAddingCategory ? (
                                <div
                                    className={`rounded-lg border p-4 space-y-4 ${
                                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <Input
                                        label="New Category Name"
                                        value={categoryFormData.name}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCreateCategory();
                                            }
                                        }}
                                        isDark={isDark}
                                        required={categories.length === 0}
                                    />

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Category Description
                                        </label>
                                        <textarea
                                            value={categoryFormData.description}
                                            onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg ${
                                                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                            }`}
                                            rows="3"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="success"
                                            size="sm"
                                            onClick={handleCreateCategory}
                                            disabled={creatingCategory}
                                        >
                                            {creatingCategory ? 'Saving...' : 'Save Category'}
                                        </Button>
                                        {categories.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setShowCategoryForm(false);
                                                    setCategoryFormData(createInitialCategoryData());
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className={`w-full px-4 py-2 border rounded-lg ${
                                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                    }`}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {categories.length === 0
                                    ? 'Create your first category before saving the product.'
                                    : 'Choose an existing category or add a new one here.'}
                            </p>
                        </div>

                        <Input
                            label="SKU"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Barcode"
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            isDark={isDark}
                        />

                        <Input
                            label="Purchase Price"
                            type="number"
                            step="0.01"
                            value={formData.purchasePrice}
                            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                            isDark={isDark}
                            required
                        />

                        <Input
                            label="Selling Price"
                            type="number"
                            step="0.01"
                            value={formData.sellingPrice}
                            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                            isDark={isDark}
                            required
                        />

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Availability
                            </label>
                            <select
                                value={formData.isAvailable ? '1' : '0'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        isAvailable: e.target.value === '1',
                                    })
                                }
                                className={`w-full px-4 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                }`}
                                required
                            >
                                <option value="1">Available</option>
                                <option value="0">Not Available</option>
                            </select>
                            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Mark products as not available instead of managing stock quantities here.
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                }`}
                                rows="3"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Product Image
                            </label>
                            <div className="flex flex-col gap-3">
                                {formData.imageUrl && (
                                    <img
                                        src={resolveImageUrl(formData.imageUrl)}
                                        alt={formData.name || 'Product preview'}
                                        className="h-32 w-32 rounded-lg object-cover border border-gray-300"
                                    />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className={`w-full px-4 py-2 border rounded-lg ${
                                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                                <Input
                                    label="Image URL"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    isDark={isDark}
                                    placeholder="Uploaded image URL will appear here"
                                />
                                {formData.imageUrl && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="self-start"
                                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                    >
                                        Remove Image
                                    </Button>
                                )}
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {uploadingImage ? 'Uploading image...' : 'Upload an image or paste an image URL.'}
                                </p>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex gap-2">
                            <Button type="submit" variant="primary" disabled={creatingCategory || showCategoryForm || uploadingImage || !formData.categoryId}>
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={closeProductForm}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Products Table */}
            <Card isDark={isDark}>
                {products.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No products found
                    </p>
                ) : (
                    <Table>
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Name
                                    </th>
                                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        SKU
                                    </th>
                                    <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Price
                                    </th>
                                    <th className={`text-center py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Status
                                    </th>
                                    <th className={`text-center py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            <div className="flex items-center gap-3">
                                                {product.image_url && (
                                                    <img
                                                        src={resolveImageUrl(product.image_url)}
                                                        alt={product.name}
                                                        className="h-10 w-10 rounded object-cover"
                                                    />
                                                )}
                                                <span>{product.name}</span>
                                            </div>
                                        </td>
                                        <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {product.sku}
                                        </td>
                                        <td className={`py-3 px-4 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(product.selling_price)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant={isProductAvailable(product) ? 'success' : 'warning'}>
                                                {isProductAvailable(product) ? 'Available' : 'Not Available'}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="inline-flex h-9 w-9 items-center justify-center px-0"
                                                    onClick={() => handleEdit(product)}
                                                >
                                                    <FiEdit2 />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={isProductAvailable(product) ? 'danger' : 'success'}
                                                    className="inline-flex h-9 w-36 items-center justify-center whitespace-nowrap"
                                                    disabled={togglingProductId === product.id}
                                                    onClick={() => handleAvailabilityToggle(product)}
                                                >
                                                    {togglingProductId === product.id
                                                        ? 'Saving...'
                                                        : isProductAvailable(product)
                                                            ? 'Not Available'
                                                            : 'Available'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                    </Table>
                )}
            </Card>
        </div>
    );
};

export default ProductsPage;
