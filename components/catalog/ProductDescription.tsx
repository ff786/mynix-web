import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

type Block = { type: "paragraph"; text: string } | { type: "list"; items: string[] };

const BULLET = /^\s*[-•]\s+/;

/** Blank lines split paragraphs; lines starting with "- " (or "•") are bullet points. */
function toBlocks(description: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of description.split(/\n\s*\n/)) {
    let paragraph: string[] = [];
    let list: string[] = [];
    const flushParagraph = () => {
      if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    };
    const flushList = () => {
      if (list.length) blocks.push({ type: "list", items: list });
      list = [];
    };
    for (const raw of chunk.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (BULLET.test(line)) {
        flushParagraph();
        list.push(line.replace(BULLET, ""));
      } else {
        flushList();
        paragraph.push(line);
      }
    }
    flushParagraph();
    flushList();
  }
  return blocks;
}

/** A product's detailed description, as plain text (never HTML) from the POS. */
export default function ProductDescription({ description, className }: { description: string; className?: string }) {
  const blocks = toBlocks(description);
  if (blocks.length === 0) return null;

  return (
    <div className={cn("space-y-4 leading-relaxed text-white/65", className)}>
      {blocks.map((block, i) =>
        block.type === "paragraph" ? (
          <p key={i}>{block.text}</p>
        ) : (
          <ul key={i} className="space-y-2.5">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3 text-sm text-white/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
