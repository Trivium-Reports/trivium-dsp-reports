import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle, ArrowRight } from "lucide-react";
import SectionWrapper from "./SectionWrapper";
import { getUtmParams } from "@/lib/utm";
import { supabase } from "@/integrations/supabase/client";
import type { LeadData } from "@/lib/types";

const REVENUE_OPTIONS = [
  "$0-$60k",
  "$60k-$359k",
  "$360k-$500k",
  "$500k-$999k",
  "$1M-$3M",
  "$3M+",
];

const REFERRAL_OPTIONS = [
  "You reached out to me",
  "Ads",
  "YouTube",
  "Email",
  "LinkedIn",
  "Instagram",
  "Facebook",
  "Twitter",
  "Google",
  "Podcast",
  "Webinar",
  "Trade Show / Conference",
  "Referral",
  "Other",
];

interface LeadCaptureFormProps {
  onSubmit: (lead: LeadData) => void;
}

const inputClass =
  "w-full px-5 py-3.5 rounded-xl border border-border bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

const LeadCaptureForm = ({ onSubmit }: LeadCaptureFormProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [howDidYouHear, setHowDidYouHear] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const utm = getUtmParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;

    setSubmitting(true);
    console.log("LeadCaptureForm submit started", { email, company });

    const lead: LeadData = {
      firstName,
      lastName,
      email,
      phone,
      company,
      annualRevenue,
      howDidYouHear,
      ...utm,
    };

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phone,
        company,
        annualRevenue,
        howDidYouHear,
        hutk: document.cookie.match(/hubspotutk=([^;]*)/)?.[1] || "",
        pageUri: window.location.href,
        pageName: document.title,
        ...utm,
      };

      const { data, error } = await supabase.functions.invoke("submit-hubspot", {
        body: payload,
      });

      if (error) {
        console.error("HubSpot proxy error:", error);
        alert("Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      if (data && !data.success) {
        console.error("HubSpot submission rejected:", data.error);
        alert("Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      console.log("HubSpot submission successful via proxy");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed due to a network error. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => onSubmit(lead), 1800);
  };

  return (
    <SectionWrapper>
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-display font-bold text-xs uppercase tracking-widest mb-6">
            <Lock className="w-3.5 h-3.5" />
            Free Strategic Analysis
          </div>
          <h2 className="section-heading mb-4">
            Unlock Your DSP + Sponsored Ads{" "}
            <span className="text-primary">Intelligence Report</span>
          </h2>
          <p className="section-subheading">
            Upload AMC, DSP, and Sponsored Ads exports to generate a strategic,
            narrative-led performance analysis.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-2xl p-10 shadow-sm"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight mb-2">
                  You're In.
                </h3>
                <p className="font-body text-muted-foreground">
                  Let's pull your reports.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-primary font-display font-bold text-sm uppercase tracking-wide">
                  <span>Loading onboarding</span>
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClass}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@company.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={inputClass}
                    placeholder="Company name"
                  />
                </div>

                {/* Annual Revenue */}
                <div>
                  <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                    Annual Revenue (on and off Amazon) *
                  </label>
                  <select
                    required
                    value={annualRevenue}
                    onChange={(e) => setAnnualRevenue(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select revenue range</option>
                    {REVENUE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* How did you hear */}
                <div>
                  <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">
                    How did you hear about Trivium? *
                  </label>
                  <select
                    required
                    value={howDidYouHear}
                    onChange={(e) => setHowDidYouHear(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select one</option>
                    {REFERRAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Consent */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 accent-primary w-4 h-4"
                    required
                  />
                  <span className="font-body text-xs text-muted-foreground leading-relaxed">
                    By submitting this form, you agree to receive email, SMS, and
                    phone communications from Trivium Group. You can unsubscribe
                    at any time.
                  </span>
                </label>

                {/* Hidden UTM fields */}
                <input type="hidden" name="utm_source" value={utm.utm_source} />
                <input type="hidden" name="utm_medium" value={utm.utm_medium} />
                <input type="hidden" name="utm_campaign" value={utm.utm_campaign} />
                <input type="hidden" name="utm_content" value={utm.utm_content} />
                <input type="hidden" name="utm_term" value={utm.utm_term} />

                <button
                  type="submit"
                  disabled={submitting || !consent}
                  className="w-full py-4 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Unlocking…
                    </span>
                  ) : (
                    "Unlock Your Report"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};

export default LeadCaptureForm;
