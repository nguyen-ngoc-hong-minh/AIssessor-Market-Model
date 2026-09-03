import Link from "next/link";

export function Brand({
  onClick,
  href = "/",
}: {
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  href?: string;
} = {}) {
  return (
    <Link className="brand" href={href} onClick={onClick} aria-label="Aissessor home">
      <span className="brand-text">Aissessor</span>
    </Link>
  );
}
