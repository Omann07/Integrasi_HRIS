export type CompanyAPI = {
    id: number;
    companyName: string;
    latitude: string;
    longitude: string;
    radius: number;
    logo: string | null;
  };
  
  export type CompanyUI = {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    radius: number;
    logoUrl?: string;
  };
  
  export const mapCompanyToUI = (data: CompanyAPI): CompanyUI => ({
    id: data.id,
    name: data.companyName,
    latitude: data.latitude,
    longitude: data.longitude,
    radius: data.radius,
    logoUrl: data.logo
      ? `http://localhost:8000/uploads/logoCompany/${data.logo}`
      : undefined,
  });
  