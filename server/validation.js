export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

const text = (value, name, { min = 0, max = 255 } = {}) => {
  if (typeof value !== "string") throw new ValidationError(`${name} must be text`, { [name]: "invalid_type" });
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new ValidationError(`${name} must be between ${min} and ${max} characters`, { [name]: "invalid_length" });
  }
  return normalized;
};

export const email = value => {
  const normalized = text(value, "email", { min: 3, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new ValidationError("Enter a valid email address", { email: "invalid" });
  }
  return normalized;
};

export const password = value => {
  const normalized = text(value, "password", { min: 12, max: 128 });
  if (!/[a-z]/i.test(normalized) || !/\d/.test(normalized)) {
    throw new ValidationError("Password must contain a letter and a number", { password: "weak" });
  }
  return normalized;
};

export function registration(input) {
  const name = text(input?.name, "name", { min: 2, max: 100 });
  if (/[<>\u0000-\u001f\u007f]/.test(name)) {
    throw new ValidationError("Name contains unsupported characters", { name: "invalid" });
  }
  return {
    name,
    email: email(input?.email),
    password: password(input?.password)
  };
}

export function login(input) {
  return { email: email(input?.email), password: text(input?.password, "password", { min: 1, max: 128 }) };
}

export function verification(input) {
  return {
    verificationId: text(input?.verificationId, "verificationId", { min: 10, max: 100 }),
    code: text(input?.code, "code", { min: 6, max: 6 })
  };
}

export function profile(input) {
  const budget = Number(input?.budget);
  if (input?.budget != null && (!Number.isFinite(budget) || budget < 0 || budget > 1_000_000)) {
    throw new ValidationError("Budget is invalid", { budget: "invalid" });
  }
  return {
    scenario: input?.scenario == null ? null : text(input.scenario, "scenario", { max: 50 }),
    city: input?.city == null ? null : text(input.city, "city", { max: 120 }),
    budget: Number.isFinite(budget) ? Math.round(budget) : null,
    roomType: input?.roomType == null ? null : text(input.roomType, "roomType", { max: 50 }),
    moveDate: input?.moveDate || null,
    leaseDuration: input?.leaseDuration == null ? null : text(input.leaseDuration, "leaseDuration", { max: 50 }),
    country: input?.country == null ? null : text(input.country, "country", { max: 80 }),
    diet: input?.diet == null ? null : text(input.diet, "diet", { max: 80 }),
    languages: Array.isArray(input?.languages) ? input.languages.slice(0, 10).map(x => text(x, "language", { max: 40 })) : [],
    bio: input?.bio == null ? null : text(input.bio, "bio", { max: 2000 }),
    lifestyle: typeof input?.lifestyle === "object" && input.lifestyle ? input.lifestyle : {},
    weights: typeof input?.weights === "object" && input.weights ? input.weights : {},
    dealBreakers: typeof input?.dealBreakers === "object" && input.dealBreakers ? input.dealBreakers : {},
    publicStatus: input?.publicStatus == null ? null : text(input.publicStatus, "publicStatus", { max: 40 })
  };
}

export function listing(input) {
  const rent = Number(input?.rent), deposit = Number(input?.deposit || 0);
  if (!Number.isFinite(rent) || rent < 1 || rent > 1_000_000) throw new ValidationError("Rent is invalid", { rent:"invalid" });
  if (!Number.isFinite(deposit) || deposit < 0 || deposit > 2_000_000) throw new ValidationError("Deposit is invalid", { deposit:"invalid" });
  const categories = ["Private room","Shared room","Entire apartment","Lease transfer"];
  if (!categories.includes(input?.category)) throw new ValidationError("Listing category is invalid", { category:"invalid" });
  return {
    title:text(input.title,"title",{min:5,max:120}), description:input.description?text(input.description,"description",{max:5000}):null,
    category:input.category, city:text(input.city,"city",{min:2,max:120}), neighborhood:input.neighborhood?text(input.neighborhood,"neighborhood",{max:120}):null,
    exactAddress:input.exactAddress?text(input.exactAddress,"exactAddress",{max:300}):null, rent:Math.round(rent), deposit:Math.round(deposit),
    availableDate:input.availableDate||null, leaseDuration:input.leaseDuration?text(input.leaseDuration,"leaseDuration",{max:80}):null,
    furnished:input.furnished?text(input.furnished,"furnished",{max:40}):null, utilities:input.utilities?text(input.utilities,"utilities",{max:200}):null,
    parking:input.parking?text(input.parking,"parking",{max:100}):null, laundry:input.laundry?text(input.laundry,"laundry",{max:100}):null,
    accessibility:input.accessibility?text(input.accessibility,"accessibility",{max:200}):null,
    amenities:Array.isArray(input.amenities)?input.amenities.slice(0,30).map(x=>text(x,"amenity",{max:60})):[],
    latitude:Number.isFinite(Number(input.latitude))?Number(input.latitude):null, longitude:Number.isFinite(Number(input.longitude))?Number(input.longitude):null
  };
}
