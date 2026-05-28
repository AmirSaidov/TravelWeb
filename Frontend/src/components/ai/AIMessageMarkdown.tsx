import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const linkProps = (href?: string) => {
  const external = Boolean(href && /^https?:\/\//i.test(href));
  return external ? { target: "_blank", rel: "noreferrer" } : {};
};

export function AIMessageMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none break-words leading-7 text-foreground",
        "prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-display prose-headings:text-foreground",
        "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
        "prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5",
        "prose-strong:text-foreground prose-a:text-primary prose-a:underline prose-a:underline-offset-4",
        "prose-code:break-words prose-code:rounded-md prose-code:bg-background prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-semibold prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:my-3 prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-foreground prose-pre:p-4 prose-pre:text-background",
        "prose-hr:my-4 prose-hr:border-border",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} {...linkProps(href)} {...props}>
              {children}
            </a>
          ),
          pre: ({ children }) => <pre>{children}</pre>,
          code: ({ className, children, ...props }: any) => (
            <code className={className} {...props}>
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
