import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListQrCodes, useDeleteQrCode } from "@workspace/api-client-react";
import { QrPreview } from "@/components/qr/QrPreview";
import { QrAnalyticsModal } from "@/components/qr/QrAnalyticsModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Trash2, BarChart2, Calendar, Link as LinkIcon, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { exportQrCode } from "@/lib/export-qr";
import { motion, AnimatePresence } from "framer-motion";

export default function History() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"createdAt" | "name" | "scans">("createdAt");
  const [analyticsId, setAnalyticsId] = useState<number | null>(null);
  
  const { data, isLoading } = useListQrCodes({ 
    search: search.length > 2 ? search : undefined,
    sortBy: sort,
    order: "desc"
  });

  const deleteMutation = useDeleteQrCode();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this QR code?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => toast({ title: "Deleted", description: "QR Code removed." })
      });
    }
  };

  const handleDownload = (qr: any) => {
    toast({ title: "Exporting...", description: "Preparing image." });
    exportQrCode(qr.content, qr.style, 'png').catch(() => {
      toast({ title: "Export failed", variant: "destructive" });
    });
  };

  return (
    <AppLayout>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 font-display">Your Codes</h1>
          <p className="text-muted-foreground text-lg">Manage and analyze your generated QR codes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 bg-black/40 border-white/10 rounded-xl w-full focus-visible:ring-primary"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-4 bg-black/40 border-white/10 rounded-xl hover:bg-white/10 hover:text-white">
                Sort: {sort === 'createdAt' ? 'Newest' : sort === 'name' ? 'Name' : 'Scans'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-white/10">
              <DropdownMenuItem onClick={() => setSort('createdAt')}>Date Created</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('name')}>Name (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('scans')}>Most Scans</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-[2rem] p-4 space-y-4">
                <Skeleton className="w-full aspect-square rounded-3xl bg-white/5" />
                <div className="space-y-2 px-2">
                  <Skeleton className="h-6 w-3/4 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                </div>
              </div>
            ))
          ) : data?.data?.length === 0 ? (
            <div className="col-span-full py-20 text-center glass-card rounded-[2rem] border-dashed border-2 border-white/10">
              <LinkIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No QR Codes Found</h3>
              <p className="text-muted-foreground">You haven't created any QR codes yet, or none match your search.</p>
            </div>
          ) : (
            data?.data?.map((qr) => (
              <motion.div 
                key={qr.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card rounded-[2rem] p-4 group hover:bg-white/5 transition-all duration-300 border border-white/10"
              >
                <div className="relative mb-6">
                  {/* Reuse the QrPreview component but make it non-interactive */}
                  <div className="pointer-events-none">
                    <QrPreview content={qr.content} styleConfig={qr.style} />
                  </div>
                  
                  {/* Quick actions overlay */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[2rem] flex flex-col items-center justify-center gap-3">
                    <Button onClick={() => handleDownload(qr)} className="rounded-full bg-white text-black hover:bg-gray-200">
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                    <Button onClick={() => setAnalyticsId(qr.id)} variant="outline" className="rounded-full bg-black/50 border-white/20 text-white hover:bg-primary/20 hover:border-primary">
                      <BarChart2 className="w-4 h-4 mr-2" /> Analytics
                    </Button>
                  </div>
                </div>

                <div className="px-2 pb-2">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-white truncate flex-1">{qr.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card border-white/10">
                        <DropdownMenuItem onClick={() => setAnalyticsId(qr.id)}>
                          <BarChart2 className="w-4 h-4 mr-2" /> View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/20 focus:text-destructive" onClick={() => handleDelete(qr.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
                      <Scan className="w-3.5 h-3.5" /> {qr.scans} scans
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> 
                      {format(parseISO(qr.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <QrAnalyticsModal 
        qrId={analyticsId} 
        isOpen={!!analyticsId} 
        onClose={() => setAnalyticsId(null)} 
      />
    </AppLayout>
  );
}
