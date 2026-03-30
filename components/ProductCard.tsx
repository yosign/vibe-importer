import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductCard({
  label,
  value,
  detail,
  tone = "default"
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "secondary";
}) {
  return (
    <Card className="border-white/70 bg-white/90 backdrop-blur">
      <CardHeader className="pb-3">
        <Badge variant={tone === "secondary" ? "secondary" : "default"}>{label}</Badge>
      </CardHeader>
      <CardContent className="space-y-1">
        <CardTitle className="text-3xl">{value}</CardTitle>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
