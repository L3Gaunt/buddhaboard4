import * as React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: any) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(event.target.value);
      }
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <select
        className={`
          flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
          ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
          placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed
          disabled:opacity-50 ${className || ""}
        `.trim()}
        ref={ref}
        onChange={handleChange}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export { Select }; 