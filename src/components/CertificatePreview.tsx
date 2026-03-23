import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, TextStyle } from 'react-native';
import { getMediaUrl } from '../services/api';

interface Placeholder {
    id?: string;
    type: string;
    x: number;
    y: number;
    fontSize: number;
    color?: string;
    label?: string;
}

interface CertificatePreviewProps {
    backgroundMediaId: string;
    placeholders: Placeholder[];
    data: Record<string, string>;
    containerStyle?: ViewStyle;
}

export const generateCertificateHTML = (
    backgroundUrl: string,
    placeholders: Placeholder[],
    data: Record<string, string>
) => {
    const placeholderHtml = placeholders.map((p) => {
        const value = data[p.type] || p.label || p.type;
        return `
            <div style="
                position: absolute;
                left: ${p.x}%;
                top: ${p.y}%;
                transform: translate(-50%, -50%);
                font-size: ${p.fontSize * 2}px;
                color: ${p.color || '#000'};
                font-weight: bold;
                text-align: center;
                white-space: nowrap;
                font-family: Arial, sans-serif;
            ">
                ${value}
            </div>
        `;
    }).join('');

    return `
        <html>
            <head>
                <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        width: 100%;
                    }
                    .container {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background-color: #fff;
                    }
                    .background {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                    .overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="${backgroundUrl}" class="background" />
                    <div class="overlay">
                        ${placeholderHtml}
                    </div>
                </div>
            </body>
        </html>
    `;
};

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ 
    backgroundMediaId,
    placeholders,
    data,
    containerStyle
}) => {
    const [containerWidth, setContainerWidth] = React.useState(0);

    return (
        <View 
            style={[styles.container, containerStyle]}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <Image
                source={{ uri: getMediaUrl(backgroundMediaId) }}
                style={styles.background}
                resizeMode="contain"
            />
            <View style={styles.overlay}>
                {placeholders.map((p, index) => {
                    const key = p.id || p.type;
                    const value = data[key] || p.label || p.type;
                    
                    // Scale font size proportionally to container width (base 400)
                    // This matches the backend logic: (p.fontSize / 400) * image_width
                    const scaledFontSize = containerWidth > 0 
                        ? (p.fontSize * (containerWidth / 400)) 
                        : p.fontSize;

                    return (
                        <View
                            key={index}
                            style={[
                                styles.placeholderContainer,
                                { left: `${p.x}%`, top: `${p.y}%` }
                            ]}
                        >
                            <Text
                                style={[
                                    styles.placeholderText,
                                    { fontSize: scaledFontSize || 20, color: p.color || '#000' }
                                ]}
                            >
                                {value}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 1.414, // Standard A4-ish ratio
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    background: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    placeholderContainer: {
        position: 'absolute',
        // Correct centering in React Native: 
        // We use fractional offsets as strings (supported in many RN versions)
        // or we could use flex centering if the container has no fixed size.
        transform: [{ translateX: '-50%' } as any, { translateY: '-50%' } as any],
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontWeight: 'bold',
        textAlign: 'center',
    }
});
