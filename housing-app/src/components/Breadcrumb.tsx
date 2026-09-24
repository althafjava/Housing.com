import Link from "next/link";

export default function Breadcrumb({ cityName, localityName }: { cityName: string; localityName?: string }) {
  const label = localityName
    ? `Search AllResidential in ${localityName}, ${cityName}`
    : `Search AllResidential in ${cityName}`;

  return (
    <div className="breadcrumb">
      <div className="breadcrumb__inner">
        <Link href="/search">Home</Link>
        <span>&gt;</span>
        <Link href="/search">{cityName}</Link>
        <span>&gt;</span>
        <Link href="/search">Real Estate</Link>
        <span>&gt;</span>
        <Link href="/search">Residential Property</Link>
        <span>&gt;</span>
        <span className="breadcrumb__current">{label}</span>
      </div>
    </div>
  );
}
