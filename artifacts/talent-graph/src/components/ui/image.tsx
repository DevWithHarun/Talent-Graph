/**
 * Drop-in replacement for next/image.
 * Renders a plain <img> tag with the same props interface.
 */
import React from 'react';

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  sizes?: string;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ fill, priority: _priority, quality: _quality, placeholder: _placeholder, blurDataURL: _blurDataURL, ...props }, ref) => {
    const style: React.CSSProperties = fill
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...props.style }
      : (props.style ?? {});
    return <img ref={ref} {...props} style={style} />;
  }
);

Image.displayName = 'Image';

export default Image;
