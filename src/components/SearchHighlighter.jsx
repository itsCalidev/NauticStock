import React from 'react';
import { Box } from '@mui/material';
import { normalizeText } from '../utils/searchUtils';

const SearchHighlighter = ({ text, searchTerm, sx = {} }) => {
    if (!searchTerm || !text || text === null || text === undefined) {
        return <span style={sx}>{text || ''}</span>;
    }

    const textStr = String(text);
    const searchStr = String(searchTerm);

    if (searchStr.trim() === '') {
        return <span style={sx}>{textStr}</span>;
    }

    try {
        const normalizedText = normalizeText(textStr);
        const searchWords = normalizeText(searchStr).split(/\s+/).filter(w => w.length > 0);

        if (searchWords.length === 0) {
            return <span style={sx}>{textStr}</span>;
        }

        // Map of indices to highlight
        const highlightIndices = new Array(textStr.length).fill(false);

        searchWords.forEach(word => {
            let startIndex = 0;
            let index;
            while ((index = normalizedText.indexOf(word, startIndex)) > -1) {
                for (let i = 0; i < word.length; i++) {
                    highlightIndices[index + i] = true;
                }
                startIndex = index + 1;
            }
        });

        // Construct the result
        const result = [];
        let currentChunk = "";
        let isHighlighting = highlightIndices[0];

        for (let i = 0; i < textStr.length; i++) {
            if (highlightIndices[i] !== isHighlighting) {
                // Push current chunk
                if (currentChunk) {
                    if (isHighlighting) {
                        result.push(
                            <Box
                                key={i}
                                component="span"
                                sx={{
                                    backgroundColor: '#ffeb3b',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    padding: '0 1px',
                                    borderRadius: '2px'
                                }}
                            >
                                {currentChunk}
                            </Box>
                        );
                    } else {
                        result.push(currentChunk);
                    }
                }
                currentChunk = textStr[i];
                isHighlighting = highlightIndices[i];
            } else {
                currentChunk += textStr[i];
            }
        }

        // Push last chunk
        if (currentChunk) {
            if (isHighlighting) {
                result.push(
                    <Box
                        key={textStr.length}
                        component="span"
                        sx={{
                            backgroundColor: '#ffeb3b',
                            color: '#000',
                            fontWeight: 'bold',
                            padding: '0 1px',
                            borderRadius: '2px'
                        }}
                    >
                        {currentChunk}
                    </Box>
                );
            } else {
                result.push(currentChunk);
            }
        }

        return <span style={sx}>{result}</span>;

    } catch (error) {
        console.error('Error en SearchHighlighter:', error);
        return <span style={sx}>{textStr}</span>;
    }
};

export default SearchHighlighter;