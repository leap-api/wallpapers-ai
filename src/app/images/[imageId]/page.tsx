import ImagePage from "@/components/ImagePage/ImagePage";
import { WallpaperObject } from "@/components/HomePage/WallpaperCard";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";

interface GetDataResponse {
  desktop?: WallpaperObject;
  mobile?: WallpaperObject;
  browseMore?: WallpaperObject[];
}

async function getData(imageId: string) {
  // Fetch specific image being queried
  const { data: desktop, error: desktopError } = await supabase
    .from("images")
    .select("id, imageUrl, prompt, created_at, jobId")
    .or("device.eq.desktop,device.is.null")
    .eq("id", parseInt(imageId))
    .single();

  if (desktopError) {
    console.error(desktopError);
  }

  if (!desktop || desktopError) {
    return {} as GetDataResponse;
  }

  // Fetch all images for browser section.
  const { data: browseMore, error: browseError } = await supabase
    .from("images")
    .select("id, imageUrl, prompt, created_at")
    .or("device.eq.desktop,device.is.null")
    .neq("id", parseInt(imageId))
    .order("id", { ascending: false })
    .limit(12);

  if (browseError) {
    console.error(browseError);
  }

  if (!desktop.jobId) {
    return { desktop, browseMore } as GetDataResponse;
  }

  // Fetch Mobile image if it exists
  const { data: mobile, error: mobileError } = await supabase
    .from("images")
    .select("id, imageUrl, prompt, created_at")
    .eq("device", "mobile")
    .eq("jobId", desktop.jobId)
    .single();

  if (mobileError) {
    console.error(mobileError);
  }

  if (!mobile) {
    return { desktop, browseMore } as GetDataResponse;
  }

  return { desktop, mobile, browseMore } as GetDataResponse;
}

type Props = {
  params: { imageId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const imageId = params.imageId;
  const { desktop } = await getData(imageId);

  return {
    title: "Wallpaper #" + imageId + " | Generated by AI",
    description: "Browse free wallpapers generated by AI, powered by Leap",
    creator: "Leap",
    authors: [{ name: "Leap", url: "https://tryleap.ai" }],
    openGraph: desktop?.imageUrl
      ? {
          images: [desktop.imageUrl],
        }
      : null,
    robots: {
      index: true,
    },
  };
}

export default async function Home({
  params,
}: {
  params: {
    imageId: string;
  };
}) {
  const { imageId } = params;
  const { desktop, mobile, browseMore } = await getData(imageId);

  // If the image doesn't exist, return a 404 page
  if (!desktop) {
    notFound();
  }

  return (
    <main>
      <ImagePage wallpaper={desktop} mobile={mobile} browseMore={browseMore} />
    </main>
  );
}
