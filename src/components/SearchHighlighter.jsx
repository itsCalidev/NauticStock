import React from 'react';
import { Box } from '@mui/material';

const SearchHighlighter = ({ text, searchTerm, sx = {} }) => {
  // 👇 VALIDACIÓN MEJORADA
  if (!searchTerm || !text || text === null || text === undefined) {
    return <span style={sx}>{text || ''}</span>;
  }

  // Convertir a string de forma segura
  const textStr = String(text);
  const searchStr = String(searchTerm);

  // Si el término de búsqueda está vacío, mostrar texto normal
  if (searchStr.trim() === '') {
    return <span style={sx}>{textStr}</span>;
  }

  try {
    // Dividir el texto en partes usando el término de búsqueda
    const parts = textStr.split(new RegExp(`(${searchStr})`, 'gi'));
    
    return (
      <span style={sx}>
        {parts.map((part, index) => 
          part.toLowerCase() === searchStr.toLowerCase() ? (
            <Box
              key={index}
              component="span"
              sx={{
                backgroundColor: '#ffeb3b', // Fondo amarillo
                color: '#000',              // Texto negro
                fontWeight: 'bold',         // Negrita
                padding: '1px 2px',         // Espaciado interno
                borderRadius: '2px'         // Bordes redondeados
              }}
            >
              {part}
            </Box>
          ) : (
            part
          )
        )}
      </span>
    );
  } catch (error) {
    console.error('Error en SearchHighlighter:', error);
    return <span style={sx}>{textStr}</span>;
  }
};

export default SearchHighlighter;