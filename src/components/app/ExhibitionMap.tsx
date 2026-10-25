import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

type Booth = {
  id: string;
  status: string;
  price?: string | null;
  section?: string | null;
};

type BoothInterest = {
  id: string;
  section: string;
  price: string;
  status: "pending";
  booked_by: string;
  contact_phone: string;
  contact_email: string;
};

type BoothStore = {
  from: (table: "booths") => {
    select: (columns: "*") => Promise<{
      data: Booth[] | null;
      error: { message: string } | null;
    }>;
    upsert: (booth: BoothInterest) => Promise<{
      error: { message: string } | null;
    }>;
  };
};

type SelectedBooth = {
  id: string;
  section: string;
  price: string;
};

type ExhibitionBooth = {
  id: string;
  price: string;
};

type Pavilion = {
  value: string;
  label: string;
  title: string;
  image: string;
  description: string;
  boothPrice: string;
  included: string[];
  booths: ExhibitionBooth[];
};

const boothStore = supabase as unknown as BoothStore;

const indoorBooths: ExhibitionBooth[] = [
  ...Array.from({ length: 4 }, (_, index) => ({
    id: `Aa${index + 1}`,
    price: "Partners only · 4×5m (20sqm)",
  })),
  ...Array.from({ length: 16 }, (_, index) => ({
    id: `Ab${index + 1}`,
    price: "₦850,000 · 3×3m (9sqm)",
  })),
  ...Array.from({ length: 24 }, (_, index) => ({
    id: `Ac${index + 1}`,
    price: "₦600,000 · 2×2m",
  })),
];

const sharedMarketBooths = new Set([
  "C5",
  "C6",
  "C7",
  "C8",
  "C17",
  "C18",
  "C19",
  "C20",
  "C29",
  "C30",
  "C31",
  "C32",
]);

const pavilions: Pavilion[] = [
  {
    value: "indoor",
    label: "Indoor",
    title: "Pavilion A · Indoor Exhibition",
    image: "/expo/pavilion-a-indoor.png",
    description: "The official indoor floor plan, reproduced from the NSE Expo brochure.",
    boothPrice: "Booth sizes and rates",
    included: [
      "Aa1–Aa4: 4×5m partner spaces (partners only)",
      "Ab1–Ab16: 3×3m spaces · ₦850,000",
      "Ac1–Ac24: 2×2m spaces · ₦600,000",
      "Booth packages include shell scheme, table and chairs, power outlet, spotlight and waste basket.",
    ],
    booths: indoorBooths,
  },
  {
    value: "open-court",
    label: "Open Court",
    title: "Pavilion B · Open Court",
    image: "/expo/pavilion-b-open-court.png",
    description: "Outdoor equipment and fabrication space for heavy machinery and large displays.",
    boothPrice: "10ft gazebo / pagoda tent · ₦800,000",
    included: [
      "20 numbered exhibition spaces: B1–B20",
      "Tent setup, table and 2 chairs, fascia name plate, power outlet and waste basket.",
    ],
    booths: Array.from({ length: 20 }, (_, index) => ({
      id: `B${index + 1}`,
      price: "₦800,000 · 10ft gazebo",
    })),
  },
  {
    value: "market-square",
    label: "Market Square",
    title: "Pavilion C · Outdoor Market Square",
    image: "/expo/pavilion-c-market-square.png",
    description:
      "A traditional marketplace for souvenirs, gifts and materials connected to the host community.",
    boothPrice: "10ft canopy · ₦100,000",
    included: [
      "36 numbered spaces: C1–C36",
      "12 light-green spaces on the floor plan are shared canopies (group/cluster) at ₦100,000.",
      "Canopy setup and fascia name plate; occupants provide their own tables and chairs.",
    ],
    booths: Array.from({ length: 36 }, (_, index) => {
      const id = `C${index + 1}`;
      return {
        id,
        price: sharedMarketBooths.has(id)
          ? "₦100,000 · 10ft shared canopy (group/cluster)"
          : "₦100,000 · 10ft canopy",
      };
    }),
  },
  {
    value: "food-court",
    label: "Food Court",
    title: "Pavilion D · Outdoor Food Court",
    image: "/expo/pavilion-d-food-court.png",
    description: "Outdoor food court with spaces arranged around the central visitor area.",
    boothPrice: "20ft canopy · ₦50,000",
    included: [
      "10 numbered spaces: D1–D10",
      "Canopy setup and fascia name plate; occupants provide their own tables and chairs.",
    ],
    booths: Array.from({ length: 10 }, (_, index) => ({
      id: `D${index + 1}`,
      price: "₦50,000 · 20ft canopy",
    })),
  },
];

export default function ExhibitionMap() {
  const [activePavilion, setActivePavilion] = useState("indoor");
  const [booths, setBooths] = useState<Record<string, Booth>>({});
  const [selectedBooth, setSelectedBooth] = useState<SelectedBooth | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void fetchBooths();
  }, []);

  async function fetchBooths() {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await boothStore.from("booths").select("*");
      if (error) {
        setLoadError(error.message);
        return;
      }
      const boothMap: Record<string, Booth> = {};
      (data as Booth[] | null)?.forEach((booth) => {
        boothMap[booth.id] = booth;
      });
      setBooths(boothMap);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unexpected booth status error.");
    } finally {
      setLoading(false);
    }
  }

  const handleBoothClick = (boothId: string, sectionName: string, priceText: string) => {
    const boothData = booths[boothId] || {
      status: "available",
      price: priceText,
      section: sectionName,
    };

    if (boothData.status === "booked") {
      toast.info(`Booth ${boothId} is already fully booked and verified.`);
      return;
    }
    if (boothData.status === "pending") {
      toast.info(`Booth ${boothId} has a pending application awaiting payment verification.`);
      return;
    }

    setSelectedBooth({ id: boothId, section: sectionName, price: priceText });
    setIsModalOpen(true);
  };

  async function handleSubmitInterest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBooth) return;
    const formData = new FormData(e.currentTarget);
    const exhibitor = formData.get("exhibitor");
    const phone = formData.get("phone");
    const email = formData.get("email");

    if (typeof exhibitor !== "string" || typeof phone !== "string" || typeof email !== "string") {
      toast.error("Please complete all exhibitor contact fields.");
      return;
    }

    // Update status to 'pending' awaiting payment verification
    try {
      const { error } = await boothStore.from("booths").upsert({
        id: selectedBooth.id,
        section: selectedBooth.section,
        price: selectedBooth.price,
        status: "pending",
        booked_by: exhibitor,
        contact_phone: phone,
        contact_email: email,
      });
      if (error) {
        toast.error(`Error submitting interest: ${error.message}`);
        return;
      }
      toast.success(
        "Interest submitted successfully! The committee will verify payment and update your booth status.",
      );
      setIsModalOpen(false);
      setSelectedBooth(null);
      void fetchBooths();
    } catch (error) {
      toast.error(
        `Error submitting interest: ${
          error instanceof Error ? error.message : "Unexpected request error."
        }`,
      );
    }
  }

  const getButtonColor = (id: string) => {
    const status = booths[id]?.status || "available";
    if (status === "booked") return "bg-gray-300 text-gray-500 cursor-not-allowed";
    if (status === "pending") return "bg-amber-500 text-white shadow";
    return "bg-green-600 text-white shadow hover:bg-green-700";
  };

  return (
    <div className="mx-auto max-w-6xl p-4 font-sans sm:p-6">
      <h1 className="mb-2 text-2xl font-bold text-green-800 sm:text-3xl">
        NSE 2026 Exhibition Floor
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Official floor plans and booth details from the NSE 2026 Expo brochure.
      </p>

      {loading && <p className="mb-4 text-sm text-muted-foreground">Loading live booth status…</p>}
      {loadError && (
        <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Live booth status is unavailable: {loadError}. Booth availability shown below may need
          confirmation.
        </p>
      )}

      <Tabs value={activePavilion} onValueChange={setActivePavilion}>
        <TabsList className="mb-5 flex h-auto w-full justify-start gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pavilions.map((pavilion) => (
            <TabsTrigger key={pavilion.value} value={pavilion.value} className="shrink-0 px-3">
              {pavilion.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {pavilions.map((pavilion) => (
          <TabsContent key={pavilion.value} value={pavilion.value}>
            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
              <div className="border-b border-border p-4">
                <h2 className="text-lg font-bold text-foreground">{pavilion.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{pavilion.description}</p>
              </div>

              <div className="overflow-x-auto bg-white p-3">
                <img
                  src={pavilion.image}
                  alt={`${pavilion.title} official exhibition floor plan`}
                  className="mx-auto block w-[720px] max-w-none md:w-full"
                  loading={pavilion.value === "indoor" ? "eager" : "lazy"}
                />
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{pavilion.boothPrice}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {pavilion.included.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground">Select a booth</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green-600" />
                        Available
                      </span>
                      <span>
                        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
                        Pending
                      </span>
                      <span>
                        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-gray-300" />
                        Booked
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {pavilion.booths.map((booth) => {
                      const status = booths[booth.id]?.status || "available";
                      return (
                        <button
                          key={booth.id}
                          type="button"
                          onClick={() => handleBoothClick(booth.id, pavilion.label, booth.price)}
                          aria-label={`${booth.id}, ${status}, ${booth.price}`}
                          className={`rounded-lg p-2 text-sm font-semibold transition-transform hover:scale-105 ${getButtonColor(booth.id)}`}
                        >
                          {booth.id}
                          <span className="mt-0.5 block text-[10px] font-normal capitalize">
                            {status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>
        ))}
      </Tabs>

      {/* INTEREST FORM MODAL */}
      {isModalOpen && selectedBooth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-2xl">
            <h3 className="text-xl font-bold text-green-800 mb-1">
              Book Booth: {selectedBooth.id}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {selectedBooth.section} | {selectedBooth.price}
            </p>

            <form onSubmit={handleSubmitInterest}>
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Organization / Exhibitor Name
                </label>
                <input
                  name="exhibitor"
                  type="text"
                  required
                  className="w-full p-2 border rounded text-sm"
                  placeholder="e.g. Acme Engineering Ltd"
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  name="phone"
                  type="text"
                  required
                  className="w-full p-2 border rounded text-sm"
                  placeholder="08000000000"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full p-2 border rounded text-sm"
                  placeholder="info@company.com"
                />
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mb-4">
                Note: Submitting registers your interest. The booth status will update to pending
                until payment is verified.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-700 text-white rounded text-sm font-semibold"
                >
                  Submit Interest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
