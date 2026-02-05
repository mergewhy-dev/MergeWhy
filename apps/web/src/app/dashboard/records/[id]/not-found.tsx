import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileX, ArrowLeft } from "lucide-react";

export default function RecordNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-slate-100 rounded-full mb-4">
              <FileX className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Record not found</h2>
            <p className="text-muted-foreground mb-6">
              The decision evidence record you're looking for doesn't exist or has been removed.
            </p>
            <Button variant="default" asChild>
              <Link href="/records">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Records
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
