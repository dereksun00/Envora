import ContactForm from "@/components/ContactForm";

export default function NewContactPage() {
  return (
    <>
      <div className="top-header">
        <h2 className="page-title">New Contact</h2>
      </div>
      <div className="page-container">
        <ContactForm />
      </div>
    </>
  );
}
