interface CardProps {
  title: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

export default function Card({ title, value, color, icon }: CardProps) {
  return (
    <div className={`flex flex-col justify-center p-4 rounded-xl shadow ${color}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--color-black)" }}>{title}</h3>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
