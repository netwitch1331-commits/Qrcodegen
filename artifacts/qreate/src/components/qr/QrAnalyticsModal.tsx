import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useGetQrCodeAnalytics } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { Lock, Scan, MapPin, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrAnalyticsModalProps {
  qrId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#8b5cf6', '#d946ef', '#3b82f6', '#10b981', '#f59e0b'];

export function QrAnalyticsModal({ qrId, isOpen, onClose }: QrAnalyticsModalProps) {
  const { data, isLoading, error } = useGetQrCodeAnalytics(qrId || 1, {
    query: {
      enabled: !!qrId && isOpen,
      retry: false
    }
  });

  const isPremium = false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] glass-card border-border p-0 overflow-hidden rounded-[2rem]">
        <div className="p-6 sm:p-8 relative">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-display flex items-center gap-2">
              <Scan className="w-6 h-6 text-primary" />
              Scan Analytics
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              Track how your audience interacts with your QR code.
            </DialogDescription>
          </DialogHeader>

          {!isPremium && (
            <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center border border-border m-4 rounded-3xl mt-24">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold font-display mb-2">Premium Feature</h3>
              <p className="text-muted-foreground mb-8 max-w-md">
                Unlock advanced analytics to see exactly when, where, and how users scan your QR codes.
              </p>
              <Button className="rounded-xl px-8 h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/25">
                Upgrade to Premium
              </Button>
            </div>
          )}

          <div className={`space-y-8 ${!isPremium ? 'opacity-30 pointer-events-none' : ''}`}>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-2xl bg-foreground/[0.05]" />
                <Skeleton className="h-64 w-full rounded-2xl bg-foreground/[0.05]" />
              </div>
            ) : error || !data ? (
              <div className="p-12 text-center text-muted-foreground bg-foreground/[0.04] rounded-2xl border border-border">
                No analytics data available for this QR code yet.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-foreground/[0.04] border border-border rounded-2xl p-6">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Scans</p>
                    <p className="text-4xl font-bold font-display">{data.totalScans}</p>
                  </div>
                  <div className="bg-foreground/[0.04] border border-border rounded-2xl p-6 col-span-1 sm:col-span-2 flex items-center">
                    <p className="text-sm text-muted-foreground">
                      Scans are tracked in real-time. Share your code to see these numbers grow.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-foreground/[0.04] border border-border rounded-2xl p-6">
                    <h4 className="text-sm font-medium mb-6 flex items-center gap-2">
                      <Scan className="w-4 h-4 text-primary" /> Scans Over Time
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.scansByDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={12}
                            tickFormatter={(val) => {
                              try { return format(parseISO(val), 'MMM d'); } 
                              catch { return val; }
                            }}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-foreground/[0.04] border border-border rounded-2xl p-6">
                    <h4 className="text-sm font-medium mb-6 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-accent" /> Devices
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.scansByDevice}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="device"
                          >
                            {data.scansByDevice.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-foreground/[0.04] border border-border rounded-2xl p-6">
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" /> Top Locations
                  </h4>
                  <div className="space-y-3">
                    {data.scansByGeo.map((loc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.05]">
                        <span className="text-sm">{loc.geo}</span>
                        <span className="text-sm font-medium text-muted-foreground">{loc.count} scans</span>
                      </div>
                    ))}
                    {data.scansByGeo.length === 0 && (
                      <p className="text-sm text-muted-foreground">No location data available yet.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
