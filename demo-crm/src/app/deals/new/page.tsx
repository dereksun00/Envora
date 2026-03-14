import DealForm from "@/components/DealForm";

export default function NewDealPage() {
  return (
    <>
      <div className="top-header">
        <h2 className="page-title">New Deal</h2>
      </div>
      <div className="page-container">
        <DealForm />
      </div>
    </>
  );
}
