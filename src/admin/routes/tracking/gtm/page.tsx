import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading } from "@medusajs/ui";
import { useEffect } from "react";

const GoogleTMPage = () => {
  useEffect(() => {
    document.title = "Google Tag Manager | Admin"
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Google TM</Heading>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Google TM",
});

export default GoogleTMPage;
