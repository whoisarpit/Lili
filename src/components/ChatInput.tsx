import { Send, Loader2 } from "lucide-react";
import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/src/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="bg-white border-t border-gray-100 p-4 pb-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto flex items-end gap-3 bg-[#F9FAFB] border border-gray-200 rounded-2xl p-2 px-3 shadow-sm focus-within:ring-2 focus-within:ring-orange-200 focus-within:border-orange-400 transition-all"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type in Mandarin or English..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-1 text-[15px] placeholder:text-gray-400 max-h-[200px] outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            input.trim() && !disabled
              ? "bg-[#E67E22] text-white shadow-md hover:bg-[#D35400] active:scale-95 shadow-orange-200"
              : "bg-gray-100 text-gray-400",
          )}
        >
          {disabled ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
      <p className="text-[10px] text-center mt-3 text-gray-400 uppercase tracking-widest font-medium">
        Lǐli can speak and translate for you
      </p>
    </div>
  );
}
