"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ContinuityMark } from "@/components/icons/ContinuityMark";
import { MicrosoftLogo } from "@/components/icons/MicrosoftLogo";
import { HelpCircleIcon } from "@/components/icons/HelpCircleIcon";
import { MDS_TASKS, MDS_CATEGORIES } from "@/lib/mds-data";
import { MDS_CONNECTION } from "@/lib/mockData";
import { useLanguage } from "@/lib/useLanguage";
import { useSession } from "@/lib/session-context";

type Phase = "idle" | "connecting" | "success";

export default function LoginPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const router = useRouter();
  const { t } = useLanguage();
  const { signIn } = useSession();

  useEffect(() => {
    if (phase !== "connecting") return;
    const t1 = setTimeout(() => setPhase("success"), 1300);
    return () => clearTimeout(t1);
  }, [phase]);

  useEffect(() => {
    if (phase !== "success") return;
    const t2 = setTimeout(() => {
      signIn();
      // the hierarchy starts at the client, not the task panel
      router.push("/clients");
    }, 900);
    return () => clearTimeout(t2);
  }, [phase, router, signIn]);

  return (
    <div className="login-page">
      <div className="login-stage">
        <div className="brand-side">
          <div className="wordmark" data-od-id="brand-lockup">
            <ContinuityMark color="#fff" />
            <div>
              <span>maxinst</span>
              <br />
              <small>DEVELOPER SCRIPTS</small>
            </div>
          </div>
          <div className="kicker">Always running. Always ready.</div>
          <h1 className="headline" data-od-id="hero-headline">{t("login.headline")}</h1>
          <p className="sub">{t("login.sub")}</p>
          <div className="proof-row">
            <div className="proof"><b>{MDS_TASKS.length}</b><span>{t("login.proofTasks")}</span></div>
            <div className="proof"><b>{MDS_CATEGORIES.length}</b><span>{t("login.proofCategories")}</span></div>
            <div className="proof"><b>0</b><span>{t("login.proofCommands")}</span></div>
          </div>
        </div>

        <div className="auth-card" data-od-id="auth-card">
          <div>
            <h1>{t("login.enterTitle")}</h1>
            <p className="lede">{t("login.enterLede")}</p>
          </div>

          <button className="ms-btn" data-od-id="microsoft-signin-button" disabled={phase !== "idle"} onClick={() => setPhase("connecting")}>
            {phase === "idle" && (<><MicrosoftLogo /> {t("login.signInButton")}</>)}
            {phase === "connecting" && (<><span className="spinner" /> {t("login.connecting")}</>)}
            {phase === "success" && <>{t("login.authenticated")}</>}
          </button>

          <div className={"status-line" + (phase === "success" ? " success" : "")} data-od-id="auth-status">
            {phase === "connecting" && t("login.validating")}
            {phase === "success" && t("login.welcome", { user: MDS_CONNECTION.user })}
          </div>

          <div className="divider">{t("login.restrictedAccess")}</div>
          <p className="foot-note" data-od-id="it-support-hint">
            <HelpCircleIcon />
            {t("login.itSupport")}
          </p>
        </div>
      </div>
    </div>
  );
}
