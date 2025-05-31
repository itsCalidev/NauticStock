import React, { useState, useEffect } from "react";
import { Box, Button, TextField, useTheme, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import { Token } from "../../theme";
import AppSnackbar from "../../components/AppSnackbar";
import api from "../../api/axiosClient";

const checkoutSchema = yup.object().shape({
  part_number:  yup.string().required("Número de parte es requerido"),
  description:  yup.string().required("Descripción es requerida"),
  brand:        yup.string().required("Marca es requerida"),
  category:     yup.string().required("Categoría es requerida"),
  quantity:     yup.number().min(0, "No puede ser negativo").required("Cantidad es requerida"),
  min_stock:    yup.number().min(0, "No puede ser negativo").required("Stock mínimo es requerido"),
  max_stock:    yup.number().min(0, "No puede ser negativo").required("Stock máximo es requerido"),
  price:        yup.number().min(0, "No puede ser negativo").required("Precio es requerido"),
  location:     yup.string().required("Ubicación es requerida"),
  supplier:     yup.string().required("Proveedor es requerido"),
});

// Opciones predefinidas
const categoryOptions = [
  "Oficina", "Ferretería", "Limpieza", "Electrónica", 
  "Mantenimiento", "Seguridad", "Herramientas", "Consumibles"
];

const locationOptions = [
  "Almacén Principal A-1", "Almacén Principal A-2", "Almacén Principal B-1",
  "Almacén Principal B-2", "Almacén Oficina A-1", "Almacén Oficina A-2",
  "Depósito Temporal", "Área de Trabajo", "Laboratorio"
];

export default function EditProduct() {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme       = useTheme();
  const colors      = Token(theme.palette.mode);
  const navigate    = useNavigate();
  const { id }      = useParams();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Cargar producto al montar
  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/products/${id}`);
      setProduct(data.data);
    } catch (err) {
      console.error('Error cargando producto:', err);
      setSnackbar({
        open: true,
        message: "Error al cargar el producto",
        severity: "error",
      });
      setTimeout(() => navigate("/products"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      console.log('Actualizando producto:', values);
      await api.put(`/api/products/${id}`, values);

      setSnackbar({
        open: true,
        message: "Producto actualizado exitosamente",
        severity: "success",
      });

      // Disparar evento global para actualizar la lista de productos
      window.dispatchEvent(new Event("productUpdated"));

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/products", { replace: true });
      }, 2000);

    } catch (err) {
      console.error('Error actualizando producto:', err);
      
      const msg = err.response?.data?.error || err.response?.data?.message || "Error al actualizar el producto";
      setSnackbar({
        open: true,
        message: msg,
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={60} />
        <Box ml={2} fontSize="1.2rem">Cargando producto...</Box>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box m="20px">
        <Header title="Error" subtitle="Producto no encontrado" />
      </Box>
    );
  }

  const initialValues = {
    part_number:  product.part_number || "",
    description:  product.description || "",
    brand:        product.brand || "",
    category:     product.category || "",
    quantity:     product.quantity || 0,
    min_stock:    product.min_stock || 0,
    max_stock:    product.max_stock || 0,
    price:        product.price || 0,
    location:     product.location || "",
    supplier:     product.supplier || "",
    status:       product.status || 0
  };

  return (
    <Box m="20px">
      <Header
        title="Editar Producto"
        subtitle={`Modificar información del producto: ${product.part_number}`}
      />

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
              {/* Fila 1: Número de parte y Descripción */}
              <TextField
                fullWidth
                variant="filled"
                label="Número de Parte / Código"
                name="part_number"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.part_number}
                error={!!touched.part_number && !!errors.part_number}
                helperText={touched.part_number && errors.part_number}
                sx={{ gridColumn: "span 2" }}
              />

              <TextField
                fullWidth
                variant="filled"
                label="Descripción del Producto"
                name="description"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.description}
                error={!!touched.description && !!errors.description}
                helperText={touched.description && errors.description}
                multiline
                rows={2}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Fila 2: Marca y Categoría */}
              <TextField
                fullWidth
                variant="filled"
                label="Marca"
                name="brand"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.brand}
                error={!!touched.brand && !!errors.brand}
                helperText={touched.brand && errors.brand}
                sx={{ gridColumn: "span 2" }}
              />

              <FormControl 
                fullWidth 
                variant="filled" 
                error={!!touched.category && !!errors.category}
                sx={{ gridColumn: "span 2" }}
              >
                <InputLabel id="category-label">Categoría</InputLabel>
                <Select
                  labelId="category-label"
                  label="Categoría"
                  name="category"
                  value={values.category}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  {categoryOptions.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Fila 3: Cantidades */}
              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Cantidad Actual"
                name="quantity"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.quantity}
                error={!!touched.quantity && !!errors.quantity}
                helperText={touched.quantity && errors.quantity}
                inputProps={{ min: 0 }}
                sx={{ gridColumn: "span 1" }}
              />

              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Stock Mínimo"
                name="min_stock"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.min_stock}
                error={!!touched.min_stock && !!errors.min_stock}
                helperText={touched.min_stock && errors.min_stock}
                inputProps={{ min: 0 }}
                sx={{ gridColumn: "span 1" }}
              />

              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Stock Máximo"
                name="max_stock"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.max_stock}
                error={!!touched.max_stock && !!errors.max_stock}
                helperText={touched.max_stock && errors.max_stock}
                inputProps={{ min: 0 }}
                sx={{ gridColumn: "span 1" }}
              />

              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Precio Unitario"
                name="price"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.price}
                error={!!touched.price && !!errors.price}
                helperText={touched.price && errors.price}
                inputProps={{ min: 0, step: "0.01" }}
                sx={{ gridColumn: "span 1" }}
              />

              {/* Fila 4: Ubicación y Proveedor */}
              <FormControl 
                fullWidth 
                variant="filled" 
                error={!!touched.location && !!errors.location}
                sx={{ gridColumn: "span 2" }}
              >
                <InputLabel id="location-label">Ubicación en Almacén</InputLabel>
                <Select
                  labelId="location-label"
                  label="Ubicación en Almacén"
                  name="location"
                  value={values.location}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  {locationOptions.map((loc) => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                variant="filled"
                label="Proveedor"
                name="supplier"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.supplier}
                error={!!touched.supplier && !!errors.supplier}
                helperText={touched.supplier && errors.supplier}
                sx={{ gridColumn: "span 2" }}
              />
            </Box>

            <Box display="flex" justifyContent="end" mt="20px" gap="10px">
              <Button
                type="button"
                color="secondary"
                variant="outlined"
                onClick={() => navigate("/products")}
                sx={{ px: 4, py: 1.5 }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                color="secondary"
                variant="contained"
                sx={{ px: 4, py: 1.5 }}
              >
                Guardar Cambios
              </Button>
            </Box>
          </form>
        )}
      </Formik>

      <AppSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
}