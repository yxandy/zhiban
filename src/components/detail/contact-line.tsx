"use client";

type ContactLineProps = {
  personName: string;
  mobilePhone?: string;
  landlineType?: "internal" | "landline" | "none";
  landlinePhone?: string;
};

export function ContactLine(props: ContactLineProps) {
  const mobilePhone = (props.mobilePhone ?? "").trim();
  const landlinePhone = (props.landlinePhone ?? "").trim();
  const effectiveLandlineType = props.landlineType ?? inferLandlineType(landlinePhone);

  const renderLandline = () => {
    if (effectiveLandlineType === "internal" && landlinePhone) {
      return (
        <button
          type="button"
          onClick={() => {
            window.alert("内线电话请用单位内部座机拨打");
          }}
          className="text-right text-xs font-medium text-[var(--muted)] underline underline-offset-2"
        >
          {`内线电话 ${landlinePhone}`}
        </button>
      );
    }

    if (effectiveLandlineType === "landline" && landlinePhone) {
      return (
        <a
          href={`tel:${landlinePhone}`}
          aria-label={`拨打座机 ${landlinePhone}`}
          className="text-right text-xs font-medium text-[var(--muted)] underline underline-offset-2"
        >
          {`座机 ${landlinePhone}`}
        </a>
      );
    }

    return <span className="text-right text-xs font-medium text-[var(--muted)]">该单位无内线电话</span>;
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--line-soft)] py-2 last:border-b-0">
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--foreground)]">{props.personName}</p>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {mobilePhone ? (
          <a
            href={`tel:${mobilePhone}`}
            aria-label={`拨打手机 ${mobilePhone}`}
            className="text-right text-xs font-semibold text-[var(--foreground)] underline underline-offset-2"
          >
            {`手机 ${mobilePhone}`}
          </a>
        ) : (
          <span className="text-right text-xs font-semibold text-[var(--foreground)]">手机 待补充</span>
        )}
        {renderLandline()}
      </div>
    </div>
  );
}

function inferLandlineType(landlinePhone: string): "internal" | "landline" | "none" | undefined {
  const normalized = landlinePhone.replace(/\s+/g, "");
  if (!normalized) {
    return undefined;
  }
  const digits = normalized.replace(/[^\d]/g, "");
  if (digits.length === 5 || digits.length === 6) {
    return "internal";
  }
  if (/^0\d{2,3}-?\d+$/.test(normalized)) {
    return "landline";
  }
  return undefined;
}
