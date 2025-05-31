import React, { useState, useEffect } from "react";
import { Box, Button, TextField, useTheme, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate } from "react-router-dom";
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

const initialValues = {
  part_number:  "",
  description:  "",
  brand:        "",
  category:     "",
  quantity:     0,
  min_stock:    0,
  max_stock:    0,
  price:        0,
  location:     "",
  supplier:     "",
  status:       0 // Activo por defecto
};

// Opciones predefinidas - Estas ahora se cargan dinámicamente
const categoryOptions = [];
const locationOptions = [];

export default function CreateProduct() {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme       = useTheme();
  const colors      = Token(theme.palette.mode);
  const navigate    = useNavigate();

  // Estados para categorías y ubicaciones
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  // Cargar categorías y ubicaciones al montar el componente
  useEffect(() => {    const fetchData = async () => {
      try {
        console.log('🚀 Iniciando carga de categorías y ubicaciones...');
        
        const [categoriesResponse, locationsResponse] = await Promise.all([
          api.get("/api/categories"),
          api.get("/api/locations")
        ]);
        
        console.log('📦 Respuesta categorías completa:', categoriesResponse);
        console.log('📦 Respuesta ubicaciones completa:', locationsResponse);
        console.log('📦 Datos categorías:', categoriesResponse.data);
        console.log('📦 Datos ubicaciones:', locationsResponse.data);
        
        // Asegurar que siempre sean arrays
        const categoriesData = Array.isArray(categoriesResponse.data) 
          ? categoriesResponse.data 
          : categoriesResponse.data?.data || [];
        
        const locationsData = Array.isArray(locationsResponse.data) 
          ? locationsResponse.data 
          : locationsResponse.data?.data || [];
        
        setCategories(categoriesData);
        setLocations(locationsData);
        
        console.log('Categorías cargadas:', categoriesData.length);
        console.log('Ubicaciones cargadas:', locationsData.length);
        console.log('Categorías data:', categoriesData);
        console.log('Ubicaciones data:', locationsData);
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        console.error('❌ Error response:', error.response);
        setSnackbar({
          open: true,
          message: "Error al cargar categorías y ubicaciones",
          severity: "error",
        });
        // Asegurar arrays vacíos en caso de error
        setCategories([]);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFormSubmit = async (values, { resetForm }) => {
    try {
      console.log('Creando producto:', values);
      const { data } = await api.post("/api/products", values);

      setSnackbar({
        open:    true,
        message: "Producto creado exitosamente",
        severity:"success",
      });

      // Resetear formulario
      resetForm();

      // Disparar evento global para actualizar la lista de productos
      window.dispatchEvent(new Event("productCreated"));

      // Redirigir a la vista de productos después de 2 segundos
      setTimeout(() => {
        navigate("/products", { replace: true });
      }, 2000);

    } catch (err) {
      console.error('Error creando producto:', err);
      
      if (err.response) {
        const { status, data } = err.response;
        const msg = data.error || data.message || "Error al crear el producto";

        setSnackbar({
          open:    true,
          message: msg,
          severity: status === 400 || status === 409 ? "warning" : "error",
        });
      } else {
        setSnackbar({
          open:    true,
          message: "Fallo de conexión con el servidor",
          severity:"error",
        });
      }
    }  };

  if (loading) {
    return (
      <Box m="20px">
        <Header
          title="CREAR PRODUCTO"
          subtitle="Cargando formulario..."
        />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        title="Crear Producto"
        subtitle="Completa el formulario para registrar un nuevo producto en el inventario"
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
              />              <FormControl 
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
                  disabled={loading}
                >                  {Array.isArray(categories) && categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
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

              {/* Fila 4: Ubicación y Proveedor */}              <FormControl 
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
                  disabled={loading}
                >                  {Array.isArray(locations) && locations.map((location) => (
                    <MenuItem key={location.id} value={location.name}>
                      {location.name}
                    </MenuItem>
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
                Crear Producto
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