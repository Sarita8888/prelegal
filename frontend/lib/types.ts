export interface NdaFormData {
  party1Name: string;
  party2Name: string;
  purpose: string;
  effectiveDate: string;
  mndaTermType: "fixed" | "ongoing";
  mndaTermYears: string;
  confidentialityTermType: "fixed" | "perpetual";
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
}

export const DEFAULT_FORM_DATA: NdaFormData = {
  party1Name: "",
  party2Name: "",
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTermType: "fixed",
  mndaTermYears: "1",
  confidentialityTermType: "fixed",
  confidentialityTermYears: "1",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
};

