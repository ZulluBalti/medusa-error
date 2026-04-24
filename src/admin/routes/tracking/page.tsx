import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Button } from "@medusajs/ui";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const TrackingPage = () => {
  useEffect(() => {
    document.title = "Tracking | Admin"
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Tracking</Heading>
      </div>

      <div className="grid gap-4 px-6 py-4 md:grid-cols-2">
        {/* Meta Pixel card */}
        <div className="border rounded-lg p-4 flex flex-col gap-y-2">
          <Heading level="h3">Meta Pixel</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Configure your Meta Pixel tracking settings.
          </Text>
          <div className="mt-2">
            <Button size="small" variant="secondary" asChild>
              <Link to="/tracking/meta-pixel">Manage Meta Pixel</Link>
            </Button>
          </div>
        </div>

        {/* Google TM card */}
        <div className="border rounded-lg p-4 flex flex-col gap-y-2">
          <Heading level="h3">Google TM</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Configure your Google Tag Manager tracking settings.
          </Text>
          <div className="mt-2">
            <Button size="small" variant="secondary" asChild>
              <Link to="/tracking/gtm">Manage Google TM</Link>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Tracking",
});

export default TrackingPage;
