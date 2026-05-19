import SectionWrapper from "./SectionWrapper";
import { useEffect, useRef, useState } from "react";

const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_term: params.get("utm_term") || "",
    utm_content: params.get("utm_content") || "",
  };
};

const ApplicationSection = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    linkedin: "",
    experience: "",
    portfolio: "",
  });

  const utm = getUtmParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Application submitted:", { ...formData, ...utm });
    setSubmitted(true);
  };

  useEffect(() => {
    // Placeholder: Load HubSpot form script in production
  }, []);

  if (submitted) {
    return (
      <SectionWrapper id="apply">
        <div className="bg-card rounded-2xl p-12 shadow-sm text-center max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="section-heading mb-4">Application Received!</h2>
          <p className="section-subheading">
            Thank you for your interest in joining Trivium. Our team will review your application and reach out soon.
          </p>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="apply">
      <h2 className="section-heading text-center mb-5">
        Ready for the <span className="text-primary">Best Job</span> You'll Ever Have?
      </h2>
      <p className="section-subheading text-center mb-16 max-w-2xl mx-auto">
        We're looking for talented people who want to grow, be challenged, and make a real impact. Submit your application — we can't wait to hear from you.
      </p>
      <div className="bg-card rounded-2xl p-10 md:p-14 shadow-sm max-w-2xl mx-auto" ref={formRef}>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">Full Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-5 py-3.5 rounded-xl border border-border bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">Email *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-3.5 rounded-xl border border-border bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">LinkedIn Profile *</label>
            <input
              type="url"
              name="linkedin"
              required
              value={formData.linkedin}
              onChange={handleChange}
              className="w-full px-5 py-3.5 rounded-xl border border-border bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div>
            <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">Years of Amazon PPC Experience *</label>
            <select
              name="experience"
              required
              value={formData.experience}
              onChange={handleChange}
              className="w-full px-5 py-3.5 rounded-xl border border-border bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            >
              <option value="">Select experience level</option>
              <option value="3-4">3–4 years</option>
              <option value="5-7">5–7 years</option>
              <option value="8+">8+ years</option>
            </select>
          </div>
          <div>
            <label className="block font-display font-bold text-sm uppercase tracking-wide mb-2">Portfolio / Examples of Accounts Managed</label>
            <textarea
              name="portfolio"
              value={formData.portfolio}
              onChange={handleChange}
              rows={4}
              className="w-full px-5 py-3.5 rounded-xl border border-border bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              placeholder="Briefly describe accounts you've managed, results achieved, or link to a portfolio..."
            />
          </div>

          <input type="hidden" name="utm_source" value={utm.utm_source} />
          <input type="hidden" name="utm_medium" value={utm.utm_medium} />
          <input type="hidden" name="utm_campaign" value={utm.utm_campaign} />
          <input type="hidden" name="utm_term" value={utm.utm_term} />
          <input type="hidden" name="utm_content" value={utm.utm_content} />

          <button
            type="submit"
            className="w-full py-4 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            Submit Application
          </button>
        </form>
      </div>
    </SectionWrapper>
  );
};

export default ApplicationSection;
