import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        title="Internal chat"
        description="Direct and group chat with document sharing, mentions, and links to operational records. Video calls can use integrated links."
      />
      <div className="two-col">
        <SectionPanel title="Rooms">
          <ul className="module-placeholder" style={{ margin: 0, paddingLeft: "1.1rem" }}>
            <li>Kasumbalesa border team</li>
            <li>Kolwezi offloading</li>
            <li>POD / invoice handover</li>
            <li>Ops managers</li>
          </ul>
        </SectionPanel>
        <EmptyModule title="Chat thread">
          Messages are searchable and retained per policy. Shared files can be linked to truck, trip,
          asset, area, or user.
        </EmptyModule>
      </div>
    </>
  );
}
