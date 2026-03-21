import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";
import { Paintbrush } from "lucide-react";

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPickerPopover({ color, onChange, label = "Select Color" }: ColorPickerPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start text-left font-normal bg-foreground/[0.05] border-border hover:bg-foreground/10 hover:text-foreground h-12 rounded-xl"
        >
          <div 
            className="w-6 h-6 rounded-md mr-3 border border-border shadow-inner" 
            style={{ backgroundColor: color }}
          />
          <span className="flex-1 truncate">{label}</span>
          <Paintbrush className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 glass-card rounded-2xl border-border" align="start">
        <HexColorPicker color={color} onChange={onChange} />
        <div className="mt-3 flex items-center gap-2">
          <div className="text-xs font-mono text-muted-foreground bg-foreground/[0.08] px-2 py-1 rounded flex-1 text-center">
            {color.toUpperCase()}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
