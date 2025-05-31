import React, { useMemo } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid"; // 👈 AGREGAR GridToolbar
import { Token } from "../../theme";
import { mockDataProviders } from "../../data/mockData";
import Header from "../../components/Header";
import { useSearch } from '../../contexts/SearchContext'; // 👈 NUEVO IMPORT
import SearchHighlighter from '../../components/SearchHighlighter'; // 👈 NUEVO IMPORT

const Providers = () => {
  const theme = useTheme();
  const colors = Token(theme.palette.mode);

  const safeColors = colors || {
    primary: { 400: '#f5f5f5', 300: '#424242' },
    greenAccent: { 300: '#4caf50', 200: '#4caf50' },
    blueAccent: { 700: '#1976d2' },
    grey: { 100: '#f5f5f5', 100: '#ffffff' }
  };
  
  
  // 👇 NUEVO: Contexto de búsqueda
  const { searchTerm, isSearching } = useSearch();

  // 👇 NUEVO: Filtrar proveedores con búsqueda
  const filteredProviders = useMemo(() => {
    if (!isSearching || !searchTerm) {
      return mockDataProviders; // Mostrar todos si no hay búsqueda
    }
    
    return mockDataProviders.filter(provider => {
      const searchLower = searchTerm.toLowerCase();
      
      // Función helper para verificar si un campo contiene el término
      const contains = (field) => {
        return field && 
               typeof field === 'string' && 
               field.toLowerCase().includes(searchLower);
      };
      
      return contains(provider.name) ||
             contains(provider.phone) ||
             contains(provider.email) ||
             contains(provider.date) ||
             (provider.cost && provider.cost.toString().includes(searchLower));
    });
  }, [isSearching, searchTerm]);

  // 👇 MODIFICAR: Agregar SearchHighlighter a las columnas
  const columns = useMemo(() => [
    { 
      field: "id", 
      headerName: "ID",
      width: 70,
      headerAlign: 'center',
      align: 'center'
    },
    {
      field: "name",
      headerName: "Nombre",
      flex: 1.2,
      cellClassName: "name-column--cell",
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          fontWeight: 'bold'
        }}>
          {/* 👇 NUEVO: Resaltar nombre */}
          <SearchHighlighter 
            text={params.value} 
            searchTerm={searchTerm}
          />
        </Box>
      )
    },
    {
      field: "phone",
      headerName: "Teléfono",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          {/* 👇 NUEVO: Resaltar teléfono */}
          <SearchHighlighter 
            text={params.value} 
            searchTerm={searchTerm}
          />
        </Box>
      )
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.3,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          fontSize: '0.875rem'
        }}>
          {/* 👇 NUEVO: Resaltar email */}
          <SearchHighlighter 
            text={params.value} 
            searchTerm={searchTerm}
          />
        </Box>
      )
    },
    {
      field: "cost",
      headerName: "Costo",
      flex: 0.8,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}>
          <Typography 
            color={colors.greenAccent[500]}
            sx={{ 
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}
          >
            $
            {/* 👇 NUEVO: Resaltar costo */}
            <SearchHighlighter 
              text={params.row.cost} 
              searchTerm={searchTerm}
            />
          </Typography>
        </Box>
      )
    },
    {
      field: "date",
      headerName: "Fecha",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          fontSize: '0.875rem'
        }}>
          {/* 👇 NUEVO: Resaltar fecha */}
          <SearchHighlighter 
            text={params.value} 
            searchTerm={searchTerm}
          />
        </Box>
      )
    },
  ], [colors, searchTerm]); // 👈 AGREGAR searchTerm a las dependencias

  return (
    <Box m="20px">
      <Header 
        title="PROVEEDORES" 
        subtitle={`${filteredProviders.length} proveedores encontrados`} // 👈 NUEVO: Mostrar cantidad filtrada
      />
      
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
            fontWeight: 'bold'
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
            fontSize: '0.95rem',
            fontWeight: 'bold'
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`,
          },
          "& .MuiDataGrid-row": {
            minHeight: '60px !important',
            "&:hover": {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08) !important'  // Hover claro para modo oscuro
                : 'rgba(0, 0, 0, 0.04) !important',       // Hover oscuro para modo claro
            },
          },
        }}
      >
        <DataGrid 
          checkboxSelection 
          rows={filteredProviders} // 👈 CAMBIAR DE mockDataProviders A filteredProviders
          columns={columns}
          slots={{ toolbar: GridToolbar }} // 👈 NUEVO: Agregar toolbar
          rowHeight={60} // 👈 NUEVO: Altura consistente
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 }
            }
          }}
          pageSizeOptions={[10, 25, 50, 100]} // 👈 NUEVO: Opciones de paginación
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
        />
      </Box>
    </Box>
  );
};

export default Providers;