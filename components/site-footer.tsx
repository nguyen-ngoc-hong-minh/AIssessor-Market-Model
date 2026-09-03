import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="minimal-footer border-top">
      <div className="section footer-inner">
        <div className="footer-col-brand">
          <Brand />
          <p>Evidence-based AI stack recommendations for freelancers, creators, and small teams.</p>
        </div>
        
        <div className="footer-col">
          <strong>[ PRODUCT ]</strong>
          <Link href="#overview">Overview</Link>
          <Link href="#process">Process</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/sign-up">New Strategy</Link>
        </div>

        <div className="footer-col">
          <strong>[ LEGAL ]</strong>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </div>

      <div className="section footer-bottom">
        <small>© 2026 BENCHFLOW INC. ALL RIGHTS RESERVED. EVIDENCE-BASED RECOMMENDATIONS.</small>
      </div>
    </footer>
  );
}
